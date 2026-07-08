package com.rork.asistanrezervasyonandroid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.EditCalendar
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.data.Provider
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import com.rork.asistanrezervasyonandroid.ui.theme.parseHexColor

/** Full-width provider card used on Home + Search lists. */
@Composable
fun ProviderCard(
    provider: Provider,
    modifier: Modifier = Modifier,
    showNextSlot: Boolean = true,
) {
    val tint = parseHexColor(provider.primaryColor)
    Column(
        modifier = modifier.fillMaxWidth().asistanCard(),
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ClinicAvatar(logoUrl = provider.logoUrl, name = provider.clinicName, tint = tint, size = 54.dp)
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                Text(
                    provider.doctorName,
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.Ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                if (!provider.specialty.isNullOrEmpty()) {
                    Text(
                        provider.specialty,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = tint,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    provider.clinicName,
                    fontSize = 12.5.sp,
                    color = AppColors.InkSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            OpenStatusPill(isOpen = provider.isOpenNow)
        }

        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
            RatingView(rating = provider.rating, count = provider.reviewCount, compact = true)
            Format.distance(provider.distanceKm)?.let { MetaItem(Icons.Filled.LocationOn, it) }
            if (!provider.city.isNullOrEmpty() && provider.distanceKm == null) {
                MetaItem(Icons.Filled.Place, provider.city)
            }
            Format.priceRange(provider.priceMin, provider.priceMax, provider.currency)?.let {
                MetaItem(Icons.Filled.Sell, it)
            }
        }

        if (provider.services.isNotEmpty()) {
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                provider.services.take(4).forEach { svc ->
                    Text(
                        svc.name,
                        fontSize = 11.5.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AppColors.InkSecondary,
                        modifier = Modifier
                            .background(AppColors.Canvas, CircleShape)
                            .padding(horizontal = 9.dp, vertical = 5.dp),
                    )
                }
            }
        }

        if (showNextSlot) {
            HorizontalDivider(color = AppColors.Stroke)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
                Icon(
                    Icons.Filled.EditCalendar,
                    contentDescription = null,
                    tint = if (provider.nextAvailable != null) AppColors.Success else AppColors.InkTertiary,
                    modifier = Modifier.size(16.dp),
                )
                if (provider.nextAvailable != null) {
                    Text(
                        buildString {
                            append("İlk uygun: ")
                        },
                        fontSize = 13.sp,
                        color = AppColors.InkSecondary,
                    )
                    Text(
                        Format.nextSlotLabel(provider.nextAvailable, Format.todayIso),
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = AppColors.Ink,
                    )
                } else {
                    Text(
                        "Müsaitlik yakında eklenecek",
                        fontSize = 13.sp,
                        color = AppColors.InkTertiary,
                    )
                }
                Spacer(modifier = Modifier.weight(1f))
                Icon(
                    Icons.AutoMirrored.Filled.KeyboardArrowRight,
                    contentDescription = null,
                    tint = AppColors.InkTertiary,
                    modifier = Modifier.size(18.dp),
                )
            }
        }
    }
}

@Composable
private fun MetaItem(icon: ImageVector, text: String) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        Icon(icon, contentDescription = null, tint = AppColors.InkSecondary, modifier = Modifier.size(12.dp))
        Text(text, fontSize = 12.sp, fontWeight = FontWeight.Medium, color = AppColors.InkSecondary)
    }
}

/** Compact horizontal-scroll card used in the Home carousels. */
@Composable
fun CompactProviderCard(provider: Provider, modifier: Modifier = Modifier) {
    val tint = parseHexColor(provider.primaryColor)
    Column(
        modifier = modifier.width(200.dp).asistanCard(padding = 14.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            ClinicAvatar(logoUrl = provider.logoUrl, name = provider.clinicName, tint = tint, size = 44.dp)
            OpenStatusPill(isOpen = provider.isOpenNow)
        }
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(
                provider.doctorName,
                fontSize = 15.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                provider.specialty ?: provider.clinicName,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium,
                color = tint,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
        }
        RatingView(rating = provider.rating, count = provider.reviewCount, compact = true)
        if (provider.nextAvailable != null) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                Icon(
                    Icons.Filled.Schedule,
                    contentDescription = null,
                    tint = AppColors.Success,
                    modifier = Modifier.size(12.dp),
                )
                Text(
                    Format.nextSlotLabel(provider.nextAvailable, Format.todayIso),
                    fontSize = 11.5.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.Success,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        } else {
            Text(
                "Müsaitlik yakında",
                fontSize = 11.5.sp,
                fontWeight = FontWeight.Medium,
                color = AppColors.InkTertiary,
            )
        }
    }
}
