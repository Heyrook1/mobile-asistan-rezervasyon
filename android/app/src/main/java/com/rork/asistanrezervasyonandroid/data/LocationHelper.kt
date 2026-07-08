package com.rork.asistanrezervasyonandroid.data

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.location.Geocoder
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.os.Looper
import androidx.core.content.ContextCompat
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import kotlin.coroutines.resume

data class ResolvedLocation(
    val lat: Double,
    val lng: Double,
    val city: String?,
)

/** One-shot device location + reverse geocode, mirroring the iOS LocationManager. */
object LocationHelper {

    fun hasPermission(context: Context): Boolean =
        ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED

    /** Resolves a single coordinate + city name. Returns null if unavailable. */
    suspend fun resolve(context: Context): ResolvedLocation? {
        if (!hasPermission(context)) return null
        val location = withTimeoutOrNull(12_000L) { currentLocation(context) } ?: return null
        val city = reverseGeocodeCity(context, location.latitude, location.longitude)
        return ResolvedLocation(location.latitude, location.longitude, city)
    }

    @SuppressLint("MissingPermission")
    private suspend fun currentLocation(context: Context): Location? {
        val manager = context.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
            ?: return null
        val provider = listOf(
            LocationManager.NETWORK_PROVIDER,
            LocationManager.GPS_PROVIDER,
            LocationManager.PASSIVE_PROVIDER,
        ).firstOrNull { runCatching { manager.isProviderEnabled(it) }.getOrDefault(false) }
            ?: return null

        // A fresh-enough last-known fix avoids waiting for GPS.
        val lastKnown = manager.allProviders
            .mapNotNull { runCatching { manager.getLastKnownLocation(it) }.getOrNull() }
            .maxByOrNull { it.time }
        if (lastKnown != null && System.currentTimeMillis() - lastKnown.time < 5 * 60_000L) {
            return lastKnown
        }

        return suspendCancellableCoroutine { cont ->
            val listener = object : LocationListener {
                override fun onLocationChanged(location: Location) {
                    if (cont.isActive) cont.resume(location)
                }

                @Deprecated("Deprecated in Java")
                override fun onStatusChanged(provider: String?, status: Int, extras: android.os.Bundle?) = Unit
                override fun onProviderEnabled(provider: String) = Unit
                override fun onProviderDisabled(provider: String) {
                    if (cont.isActive) cont.resume(lastKnown)
                }
            }
            try {
                manager.requestLocationUpdates(provider, 0L, 0f, listener, Looper.getMainLooper())
            } catch (_: Exception) {
                if (cont.isActive) cont.resume(lastKnown)
            }
            cont.invokeOnCancellation { manager.removeUpdates(listener) }
        }
    }

    private suspend fun reverseGeocodeCity(context: Context, lat: Double, lng: Double): String? =
        withContext(Dispatchers.IO) {
            runCatching {
                @Suppress("DEPRECATION")
                val address = Geocoder(context, java.util.Locale("tr"))
                    .getFromLocation(lat, lng, 1)
                    ?.firstOrNull()
                address?.adminArea ?: address?.locality
            }.getOrNull()
        }
}
