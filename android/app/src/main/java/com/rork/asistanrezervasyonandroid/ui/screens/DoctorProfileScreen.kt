package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.EditCalendar
import androidx.compose.material.icons.filled.PersonSearch
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.data.NextSlot
import com.rork.asistanrezervasyonandroid.data.Provider
import com.rork.asistanrezervasyonandroid.data.ReviewItem
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.ClinicAvatar
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.RatingView
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import com.rork.asistanrezervasyonandroid.ui.theme.CardShape
import com.rork.asistanrezervasyonandroid.ui.theme.parseHexColor

@Composable
fun DoctorProfileScreen(
    staffId: String,
    auth: AuthViewModel,
    onBack: () -> Unit,
    onOpenClinic: (String) -> Unit,
    onBook: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var doctor by remember { mutableStateOf<Provider?>(null) }
    var reviews by remember { mutableStateOf<List<ReviewItem>>(emptyList()) }
    var isLoading by remember { mutableStateOf(true) }
    val coord = auth.coordinate

    LaunchedEffect(staffId) {
        runCatching {
            val res = ApiService.doctor(staffId, coord?.first, coord?.second)
            doctor = res.doctor
            reviews = res.reviews
        }
        isLoading = false
    }

    val tint = parseHexColor(doctor?.primaryColor)

    Column(modifier = modifier.fillMaxSize().background(AppColors.Canvas).statusBarsPadding()) {
        // Top bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = AppColors.Ink)
            }
            Text(
                doctor?.doctorName ?: "",
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.weight(1f),
            )
            Spacer(modifier = Modifier.size(48.dp))
        }

        when {
            isLoading -> Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppColors.Teal)
            }
            doctor == null -> EmptyStateView(
                icon = Icons.Filled.PersonSearch,
                title = "Doktor bulunamadı",
                message = "Bu profil artık mevcut değil.",
            )
            else -> {
                val doc = doctor!!
                Box(modifier = Modifier.fillMaxSize()) {
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .verticalScroll(rememberScrollState())
                            .padding(horizontal = 18.dp)
                            .padding(top = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(18.dp),
                    ) {
                        HeroHeader(doc, tint)
                        doc.nextAvailable?.let { NextSlotBanner(it) }
                        if (!doc.bio.isNullOrEmpty()) {
                            InfoCard(title = "Hakkında", icon = Icons.Filled.PersonSearch, tint = tint) {
                                Text(doc.bio, fontSize = 14.sp, color = AppColors.InkSecondary)
                            }
                        }
                        ServicesCard(doc, tint)
                        ClinicRowCard(doc, tint) { onOpenClinic(doc.businessId) }
                        if (reviews.isNotEmpty()) {
                            InfoCard(title = "Değerlendirmeler", icon = Icons.Filled.Star, tint = tint) {
                                Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                    reviews.take(5).forEachIndexed { index, review ->
                                        ReviewRow(review)
                                        if (index < minOf(reviews.size, 5) - 1) {
                                            HorizontalDivider(color = AppColors.Stroke)
                                        }
                                    }
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(120.dp))
                    }

                    // Sticky booking bar
                    BookingBar(
                        doc = doc,
                        modifier = Modifier.align(Alignment.BottomCenter),
                        onBook = { onBook(doc.staffId) },
                    )
                }
            }
        }
    }
}

@Composable
private fun HeroHeader(doc: Provider, tint: Color) {
    Column(
        modifier = Modifier.fillMaxWidth().asistanCard(padding = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ClinicAvatar(logoUrl = doc.logoUrl, name = doc.doctorName, tint = tint, size = 84.dp)
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                doc.doctorName,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
            )
            if (!doc.specialty.isNullOrEmpty()) {
                Text(doc.specialty, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = tint)
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            StatItem(
                value = if (doc.reviewCount > 0) String.format(java.util.Locale.US, "%.1f", doc.rating) else "—",
                label = "Puan",
                icon = Icons.Filled.Star,
                color = AppColors.Warning,
                modifier = Modifier.weight(1f),
            )
            StatDivider()
            StatItem(
                value = "${doc.reviewCount}",
                label = "Yorum",
                icon = Icons.Filled.ChatBubble,
                color = AppColors.Blue,
                modifier = Modifier.weight(1f),
            )
            StatDivider()
            StatItem(
                value = if (doc.isOpenNow) "Açık" else "Kapalı",
                label = "Durum",
                icon = Icons.Filled.Schedule,
                color = if (doc.isOpenNow) AppColors.Success else AppColors.InkTertiary,
                modifier = Modifier.weight(1f),
            )
        }
    }
}

@Composable
fun StatDivider() {
    Box(modifier = Modifier.size(width = 1.dp, height = 32.dp).background(AppColors.Stroke))
}

@Composable
fun StatItem(value: String, label: String, icon: ImageVector, color: Color, modifier: Modifier = Modifier) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(4.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(14.dp))
            Text(value, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
        }
        Text(label, fontSize = 12.sp, color = AppColors.InkTertiary)
    }
}

@Composable
private fun NextSlotBanner(next: NextSlot) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(CardShape)
            .background(AppColors.HeroGradient)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(Icons.Filled.EditCalendar, contentDescription = null, tint = Color.White, modifier = Modifier.size(26.dp))
        Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text("İlk uygun randevu", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = Color.White.copy(alpha = 0.9f))
            Text(
                Format.nextSlotLabel(next, Format.todayIso),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = Color.White,
            )
        }
    }
}

@Composable
private fun ServicesCard(doc: Provider, tint: Color) {
    InfoCard(title = "Hizmetler", icon = Icons.Filled.EditCalendar, tint = tint) {
        Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            if (doc.services.isEmpty()) {
                Text("Henüz hizmet eklenmemiş.", fontSize = 13.sp, color = AppColors.InkTertiary)
            } else {
                doc.services.forEachIndexed { index, svc ->
                    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                            Text(svc.name, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = AppColors.Ink)
                            Text("${svc.durationMin} dk", fontSize = 12.sp, color = AppColors.InkTertiary)
                        }
                        Text(
                            Format.price(svc.price, svc.currency),
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold,
                            color = tint,
                        )
                    }
                    if (index < doc.services.size - 1) {
                        HorizontalDivider(color = AppColors.Stroke)
                    }
                }
            }
        }
    }
}

@Composable
private fun ClinicRowCard(doc: Provider, tint: Color, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .pressableClickable { onClick() }
            .asistanCard(),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        ClinicAvatar(logoUrl = doc.logoUrl, name = doc.clinicName, tint = tint, size = 46.dp)
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            Text(doc.clinicName, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
            val addr = doc.address ?: doc.city
            if (addr != null) {
                Text(addr, fontSize = 12.5.sp, color = AppColors.InkSecondary, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
        }
        Icon(
            Icons.AutoMirrored.Filled.KeyboardArrowRight,
            contentDescription = null,
            tint = AppColors.InkTertiary,
            modifier = Modifier.size(18.dp),
        )
    }
}

@Composable
fun InfoCard(
    title: String,
    icon: ImageVector,
    tint: Color,
    modifier: Modifier = Modifier,
    content: @Composable () -> Unit,
) {
    Column(
        modifier = modifier.fillMaxWidth().asistanCard(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
            Text(title, fontSize = 17.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
        }
        content()
    }
}

@Composable
fun ReviewRow(review: ReviewItem, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(6.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(horizontalArrangement = Arrangement.spacedBy(3.dp)) {
                (1..5).forEach { i ->
                    Icon(
                        Icons.Filled.Star,
                        contentDescription = null,
                        tint = if (i <= review.rating) AppColors.Warning else AppColors.Stroke,
                        modifier = Modifier.size(14.dp),
                    )
                }
            }
            Spacer(modifier = Modifier.weight(1f))
            Text(
                Format.shortDate(review.createdAt.take(10)),
                fontSize = 11.sp,
                color = AppColors.InkTertiary,
            )
        }
        if (!review.comment.isNullOrEmpty()) {
            Text(review.comment, fontSize = 13.5.sp, color = AppColors.InkSecondary)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            review.serviceQuality?.let { MiniStat("Kalite", it) }
            review.waitingTime?.let { MiniStat("Bekleme", it) }
            review.communication?.let { MiniStat("İletişim", it) }
        }
    }
}

@Composable
private fun MiniStat(label: String, value: Int) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(label, fontSize = 10.5.sp, color = AppColors.InkTertiary)
        Text("$value", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = AppColors.InkSecondary)
        Icon(Icons.Filled.Star, contentDescription = null, tint = AppColors.Warning, modifier = Modifier.size(10.dp))
    }
}

@Composable
private fun BookingBar(doc: Provider, onBook: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier
            .fillMaxWidth()
            .background(AppColors.Surface)
            .navigationBarsPadding()
            .padding(horizontal = 20.dp)
            .padding(top = 14.dp, bottom = 14.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(1.dp)) {
            val range = Format.priceRange(doc.priceMin, doc.priceMax, doc.currency)
            if (range != null) {
                Text(range, fontSize = 18.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
                Text("başlangıç fiyatı", fontSize = 11.sp, color = AppColors.InkTertiary)
            } else {
                Text("Randevu al", fontSize = 16.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
            }
        }
        val enabled = doc.services.isNotEmpty()
        Row(
            modifier = Modifier
                .height(52.dp)
                .clip(RoundedCornerShape(15.dp))
                .background(AppColors.BrandGradient)
                .then(if (enabled) Modifier else Modifier.background(Color.White.copy(alpha = 0.5f)))
                .pressableClickable(enabled = enabled) { onBook() }
                .padding(horizontal = 26.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(7.dp),
        ) {
            Text("Randevu al", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
            Icon(
                Icons.AutoMirrored.Filled.ArrowForward,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(16.dp),
            )
        }
    }
}
