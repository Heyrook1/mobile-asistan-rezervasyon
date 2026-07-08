package com.rork.asistanrezervasyonandroid.data

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.GregorianCalendar
import java.util.Locale
import java.util.TimeZone

/** Formatting helpers shared across cards — mirrors iOS Format enum. */
object Format {
    private val monthNames = listOf("Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara")
    private val weekdayNames = listOf("Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt")

    fun price(value: Double, currency: String = "TRY"): String {
        val symbol = if (currency == "TRY") "₺" else currency
        return if (value == Math.floor(value)) {
            "$symbol${value.toLong()}"
        } else {
            "$symbol${String.format(Locale.US, "%.2f", value)}"
        }
    }

    fun priceRange(min: Double?, max: Double?, currency: String): String? {
        if (min == null) return null
        if (max != null && max != min) {
            return "${price(min, currency)} – ${price(max, currency)}"
        }
        return price(min, currency)
    }

    fun distance(km: Double?): String? {
        if (km == null) return null
        if (km < 1) return "${(km * 1000).toInt()} m"
        return String.format(Locale.US, "%.1f km", km)
    }

    /** "2026-06-15" -> "15 Haz Pzt" */
    fun shortDate(iso: String): String {
        val parts = iso.split("-")
        if (parts.size != 3) return iso
        val y = parts[0].toIntOrNull() ?: return iso
        val m = parts[1].toIntOrNull() ?: return iso
        val d = parts[2].toIntOrNull() ?: return iso
        val cal = GregorianCalendar(y, m - 1, d)
        val weekday = cal.get(Calendar.DAY_OF_WEEK) - 1 // Calendar.SUNDAY == 1
        val month = if (m in 1..12) monthNames[m - 1] else ""
        return "$d $month ${weekdayNames[weekday]}"
    }

    /** Friendly label for next-available slot. */
    fun nextSlotLabel(slot: NextSlot, today: String): String {
        if (slot.date == today) return "Bugün ${slot.startTime}"
        return "${shortDate(slot.date)} • ${slot.startTime}"
    }

    val todayIso: String
        get() {
            val cal = Calendar.getInstance(TimeZone.getTimeZone("Europe/Istanbul"))
            return String.format(
                Locale.US, "%04d-%02d-%02d",
                cal.get(Calendar.YEAR), cal.get(Calendar.MONTH) + 1, cal.get(Calendar.DAY_OF_MONTH)
            )
        }

    /** Next 14 bookable dates in the business timezone. */
    fun dateOptions(count: Int = 14): List<String> {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("Europe/Istanbul"))
        return (0 until count).map { offset ->
            val c = cal.clone() as Calendar
            c.add(Calendar.DAY_OF_MONTH, offset)
            String.format(
                Locale.US, "%04d-%02d-%02d",
                c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH)
            )
        }
    }

    /** "09:00:00" -> "09:00" */
    fun hhmm(time: String): String = time.take(5)

    /** Relative time label for notifications ("5 dk önce"). */
    fun relativeTime(iso: String): String {
        val date = parseIso(iso) ?: return shortDate(iso.take(10))
        val interval = (System.currentTimeMillis() - date.time) / 1000
        return when {
            interval < 60 -> "Az önce"
            interval < 3600 -> "${interval / 60} dk önce"
            interval < 86400 -> "${interval / 3600} saat önce"
            interval < 604800 -> "${interval / 86400} gün önce"
            else -> shortDate(iso.take(10))
        }
    }

    private fun parseIso(iso: String): Date? {
        if (iso.length < 19) return null
        val df = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        df.timeZone = TimeZone.getTimeZone("UTC")
        return runCatching { df.parse(iso.take(19)) }.getOrNull()
    }
}
