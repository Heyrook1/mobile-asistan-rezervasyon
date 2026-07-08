package com.rork.asistanrezervasyonandroid.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.spring
import androidx.compose.animation.core.tween
import coil3.compose.AsyncImage
import com.rork.asistanrezervasyonandroid.data.AppointmentStatus
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import com.rork.asistanrezervasyonandroid.ui.theme.CardShape

/** Standard rounded card container used throughout the app. */
fun Modifier.asistanCard(padding: Dp = 16.dp): Modifier = this
    .clip(CardShape)
    .background(AppColors.Surface)
    .border(1.dp, AppColors.Stroke, CardShape)
    .padding(padding)

/** Press-scale click modifier mirroring iOS PressableStyle. */
@Composable
fun Modifier.pressableClickable(enabled: Boolean = true, onClick: () -> Unit): Modifier {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    val scaleValue by animateFloatAsState(
        targetValue = if (pressed) 0.97f else 1f,
        animationSpec = spring(dampingRatio = 0.7f),
        label = "pressScale",
    )
    return this
        .scale(scaleValue)
        .clickable(interactionSource = interaction, indication = null, enabled = enabled, onClick = onClick)
}

// MARK: Avatar / Logo

@Composable
fun ClinicAvatar(
    logoUrl: String?,
    name: String,
    tint: Color,
    size: Dp = 52.dp,
    modifier: Modifier = Modifier,
) {
    val initials = remember(name) {
        name.split(" ").filter { it.isNotBlank() }.take(2)
            .mapNotNull { it.firstOrNull()?.uppercaseChar() }
            .joinToString("")
    }
    val shape = RoundedCornerShape(size * 0.28f)
    Box(
        modifier = modifier.size(size).clip(shape),
        contentAlignment = Alignment.Center,
    ) {
        Box(
            modifier = Modifier
                .size(size)
                .background(Brush.linearGradient(listOf(tint.copy(alpha = 0.9f), tint.copy(alpha = 0.6f)))),
            contentAlignment = Alignment.Center,
        ) {
            Text(
                text = initials.ifEmpty { "AS" },
                color = Color.White,
                fontSize = (size.value * 0.34f).sp,
                fontWeight = FontWeight.Bold,
            )
        }
        if (!logoUrl.isNullOrEmpty()) {
            AsyncImage(
                model = logoUrl,
                contentDescription = name,
                modifier = Modifier.size(size),
                contentScale = ContentScale.Crop,
            )
        }
    }
}

// MARK: Rating stars

@Composable
fun RatingView(rating: Double, count: Int, compact: Boolean = false, modifier: Modifier = Modifier) {
    Row(modifier = modifier, verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(
            Icons.Filled.Star,
            contentDescription = null,
            tint = AppColors.Warning,
            modifier = Modifier.size(if (compact) 14.dp else 16.dp),
        )
        if (count > 0) {
            Text(
                String.format(java.util.Locale.US, "%.1f", rating),
                fontSize = if (compact) 12.sp else 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = AppColors.Ink,
            )
            Text(
                "($count)",
                fontSize = if (compact) 11.sp else 12.sp,
                color = AppColors.InkTertiary,
            )
        } else {
            Text(
                "Yeni",
                fontSize = if (compact) 11.sp else 12.sp,
                fontWeight = FontWeight.Medium,
                color = AppColors.InkTertiary,
            )
        }
    }
}

// MARK: Status badge

@Composable
fun StatusBadge(status: String, modifier: Modifier = Modifier) {
    val parsed = AppointmentStatus.from(status)
    val (text, color) = when (parsed) {
        AppointmentStatus.SCHEDULED -> "Onay bekliyor" to AppColors.PendingAmber
        AppointmentStatus.CONFIRMED -> "Onaylandı" to AppColors.Success
        AppointmentStatus.COMPLETED -> "Tamamlandı" to AppColors.Blue
        AppointmentStatus.CANCELLED -> "İptal edildi" to AppColors.Danger
        AppointmentStatus.NO_SHOW -> "Gelinmedi" to AppColors.InkTertiary
        null -> status to AppColors.InkSecondary
    }
    Text(
        text = text,
        fontSize = 12.sp,
        fontWeight = FontWeight.Bold,
        color = color,
        modifier = modifier
            .background(color.copy(alpha = 0.12f), CircleShape)
            .padding(horizontal = 10.dp, vertical = 5.dp),
    )
}

// MARK: Open / Closed pill

@Composable
fun OpenStatusPill(isOpen: Boolean, modifier: Modifier = Modifier) {
    val color = if (isOpen) AppColors.Success else AppColors.InkTertiary
    Row(
        modifier = modifier
            .background(color.copy(alpha = 0.1f), CircleShape)
            .padding(horizontal = 9.dp, vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(5.dp),
    ) {
        Box(modifier = Modifier.size(7.dp).background(color, CircleShape))
        Text(
            if (isOpen) "Açık" else "Kapalı",
            fontSize = 11.sp,
            fontWeight = FontWeight.SemiBold,
            color = color,
        )
    }
}

// MARK: Pill / Chip

@Composable
fun FilterChipPill(
    title: String,
    isSelected: Boolean,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    onClick: () -> Unit,
) {
    val base = modifier.clip(CircleShape)
    val decorated = if (isSelected) {
        base.background(AppColors.BrandGradient)
    } else {
        base.background(AppColors.Surface).border(1.dp, AppColors.Stroke, CircleShape)
    }
    Row(
        modifier = decorated
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 9.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        if (icon != null) {
            Icon(
                icon,
                contentDescription = null,
                tint = if (isSelected) Color.White else AppColors.InkSecondary,
                modifier = Modifier.size(14.dp),
            )
        }
        Text(
            title,
            fontSize = 14.sp,
            fontWeight = FontWeight.SemiBold,
            color = if (isSelected) Color.White else AppColors.InkSecondary,
        )
    }
}

// MARK: Primary button

@Composable
fun PrimaryButton(
    title: String,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    isLoading: Boolean = false,
    enabled: Boolean = true,
    onClick: () -> Unit,
) {
    val shape = RoundedCornerShape(16.dp)
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(54.dp)
            .clip(shape)
            .background(AppColors.BrandGradient, shape)
            .pressableClickable(enabled = enabled && !isLoading, onClick = onClick)
            .then(if (enabled && !isLoading) Modifier else Modifier.background(Color.White.copy(alpha = 0.45f))),
        contentAlignment = Alignment.Center,
    ) {
        if (isLoading) {
            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(26.dp), strokeWidth = 2.5.dp)
        } else {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Text(title, fontSize = 17.sp, fontWeight = FontWeight.Bold, color = Color.White)
                if (icon != null) {
                    Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(18.dp))
                }
            }
        }
    }
}

// MARK: Empty + Loading states

@Composable
fun EmptyStateView(
    icon: ImageVector,
    title: String,
    message: String,
    modifier: Modifier = Modifier,
) {
    Column(
        modifier = modifier.fillMaxWidth().padding(horizontal = 32.dp, vertical = 40.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        Box(
            modifier = Modifier.size(88.dp).background(AppColors.Teal.copy(alpha = 0.1f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(40.dp))
        }
        Text(title, fontSize = 18.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
        Text(
            message,
            fontSize = 14.sp,
            color = AppColors.InkSecondary,
            textAlign = TextAlign.Center,
        )
    }
}

@Composable
fun SkeletonCard(height: Dp = 120.dp, modifier: Modifier = Modifier) {
    val transition = rememberInfiniteTransition(label = "shimmer")
    val alphaAnim by transition.animateFloat(
        initialValue = 0.4f,
        targetValue = 0.75f,
        animationSpec = infiniteRepeatable(
            animation = tween(700),
            repeatMode = RepeatMode.Reverse,
        ),
        label = "shimmerAlpha",
    )
    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(height)
            .clip(CardShape)
            .background(AppColors.Stroke.copy(alpha = alphaAnim)),
    )
}
