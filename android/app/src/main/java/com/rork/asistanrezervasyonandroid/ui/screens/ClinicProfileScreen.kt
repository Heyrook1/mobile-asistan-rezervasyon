package com.rork.asistanrezervasyonandroid.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.KeyboardArrowRight
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Star
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.ClinicInfo
import com.rork.asistanrezervasyonandroid.data.ClinicResponse
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.ClinicAvatar
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.RatingView
import com.rork.asistanrezervasyonandroid.ui.components.SkeletonCard
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import com.rork.asistanrezervasyonandroid.ui.theme.parseHexColor

@Composable
fun ClinicProfileScreen(
    businessId: String,
    auth: AuthViewModel,
    onBack: () -> Unit,
    onOpenDoctor: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var response by remember { mutableStateOf<ClinicResponse?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    val coord = auth.coordinate

    LaunchedEffect(businessId) {
        runCatching {
            response = ApiService.clinic(businessId, coord?.first, coord?.second)
        }
        isLoading = false
    }

    val business = response?.business
    val tint = parseHexColor(business?.primaryColor)

    Column(modifier = modifier.fillMaxSize().background(AppColors.Canvas).statusBarsPadding()) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            IconButton(onClick = onBack) {
                Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = AppColors.Ink)
            }
            Text(
                business?.name ?: "",
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

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            when {
                isLoading -> {
                    SkeletonCard(height = 180.dp)
                    repeat(2) { SkeletonCard(height = 140.dp) }
                }
                business == null -> EmptyStateView(
                    icon = Icons.Filled.MedicalServices,
                    title = "Klinik bulunamadı",
                    message = "Bu klinik artık mevcut değil.",
                    modifier = Modifier.padding(top = 60.dp),
                )
                else -> {
                    val res = response!!
                    ClinicHeader(business, res, tint)
                    if (!business.description.isNullOrEmpty()) {
                        InfoCard(title = "Hakkında", icon = Icons.Filled.Info, tint = tint) {
                            Text(business.description, fontSize = 14.sp, color = AppColors.InkSecondary)
                        }
                    }
                    ContactCard(business, tint)
                    DoctorsCard(res, tint, onOpenDoctor)
                    if (res.reviews.isNotEmpty()) {
                        InfoCard(title = "Değerlendirmeler", icon = Icons.Filled.Star, tint = tint) {
                            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                                res.reviews.take(6).forEachIndexed { index, review ->
                                    ReviewRow(review)
                                    if (index < minOf(res.reviews.size, 6) - 1) {
                                        HorizontalDivider(color = AppColors.Stroke)
                                    }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(90.dp))
        }
    }
}

@Composable
private fun ClinicHeader(business: ClinicInfo, res: ClinicResponse, tint: Color) {
    Column(
        modifier = Modifier.fillMaxWidth().asistanCard(padding = 20.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        ClinicAvatar(logoUrl = business.logoUrl, name = business.name, tint = tint, size = 80.dp)
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                business.name,
                fontSize = 22.sp,
                fontWeight = FontWeight.Black,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
            )
            if (business.city != null) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    Icon(Icons.Filled.Place, contentDescription = null, tint = AppColors.InkSecondary, modifier = Modifier.size(13.dp))
                    Text(
                        business.address ?: business.city,
                        fontSize = 13.sp,
                        color = AppColors.InkSecondary,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
        Row(verticalAlignment = Alignment.CenterVertically) {
            StatItem(
                value = if (res.reviewCount > 0) String.format(java.util.Locale.US, "%.1f", res.rating) else "—",
                label = "Puan",
                icon = Icons.Filled.Star,
                color = AppColors.Warning,
                modifier = Modifier.weight(1f),
            )
            StatDivider()
            StatItem(
                value = "${res.reviewCount}",
                label = "Yorum",
                icon = Icons.Filled.ChatBubble,
                color = AppColors.Blue,
                modifier = Modifier.weight(1f),
            )
            StatDivider()
            StatItem(
                value = "${res.doctors.size}",
                label = "Uzman",
                icon = Icons.Filled.Groups,
                color = tint,
                modifier = Modifier.weight(1f),
            )
        }
        Format.distance(business.distanceKm)?.let { dist ->
            Row(
                modifier = Modifier
                    .background(tint.copy(alpha = 0.1f), CircleShape)
                    .padding(horizontal = 12.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(4.dp),
            ) {
                Icon(Icons.Filled.LocationOn, contentDescription = null, tint = tint, modifier = Modifier.size(13.dp))
                Text("$dist uzaklıkta", fontSize = 12.sp, fontWeight = FontWeight.SemiBold, color = tint)
            }
        }
    }
}

@Composable
private fun ContactCard(business: ClinicInfo, tint: Color) {
    val context = LocalContext.current
    InfoCard(title = "İletişim & Konum", icon = Icons.Filled.Place, tint = tint) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            business.address?.let { ContactRow(Icons.Filled.Place, it, tint) }
            if (!business.phone.isNullOrEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .pressableClickable {
                            val number = business.phone.filter { it.isDigit() || it == '+' }
                            runCatching {
                                context.startActivity(Intent(Intent.ACTION_DIAL, Uri.parse("tel:$number")))
                            }
                        },
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(modifier = Modifier.weight(1f)) {
                        ContactRow(Icons.Filled.Phone, business.phone, tint)
                    }
                    Icon(Icons.Filled.Phone, contentDescription = "Ara", tint = tint, modifier = Modifier.size(18.dp))
                }
            }
            if (business.address == null && business.phone.isNullOrEmpty()) {
                Text("İletişim bilgisi eklenmemiş.", fontSize = 13.sp, color = AppColors.InkTertiary)
            }
        }
    }
}

@Composable
private fun ContactRow(icon: ImageVector, text: String, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(16.dp))
        Text(text, fontSize = 14.sp, color = AppColors.InkSecondary)
    }
}

@Composable
private fun DoctorsCard(res: ClinicResponse, tint: Color, onOpenDoctor: (String) -> Unit) {
    InfoCard(title = "Uzmanlar", icon = Icons.Filled.Groups, tint = tint) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            res.doctors.forEachIndexed { index, doctor ->
                val docTint = parseHexColor(doctor.color)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .pressableClickable { onOpenDoctor(doctor.staffId) }
                        .padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    ClinicAvatar(logoUrl = null, name = doctor.doctorName, tint = docTint, size = 46.dp)
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(doctor.doctorName, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
                        if (!doctor.specialty.isNullOrEmpty()) {
                            Text(doctor.specialty, fontSize = 12.5.sp, fontWeight = FontWeight.Medium, color = docTint)
                        }
                        RatingView(rating = doctor.rating, count = doctor.reviewCount, compact = true)
                    }
                    Icon(
                        Icons.AutoMirrored.Filled.KeyboardArrowRight,
                        contentDescription = null,
                        tint = AppColors.InkTertiary,
                        modifier = Modifier.size(18.dp),
                    )
                }
                if (index < res.doctors.size - 1) {
                    HorizontalDivider(color = AppColors.Stroke)
                }
            }
        }
    }
}
