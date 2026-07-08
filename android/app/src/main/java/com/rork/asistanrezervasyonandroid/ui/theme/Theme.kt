package com.rork.asistanrezervasyonandroid.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

/**
 * Central design system for Asistan — teal-forward healthcare marketplace aesthetic.
 * Mirrors the iOS Theme.swift palette (teal → blue gradient brand).
 */
object AppColors {
    val Teal = Color(0xFF0FB9A8)
    val TealDeep = Color(0xFF0A9C9A)
    val Blue = Color(0xFF1E73E8)
    val AccentGreen = Color(0xFF16C79A)

    val Ink = Color(0xFF0E1B2A)
    val InkSecondary = Color(0xFF5B6B7B)
    val InkTertiary = Color(0xFF97A4B2)

    val Surface = Color(0xFFFFFFFF)
    val Canvas = Color(0xFFF4F7FA)
    val Stroke = Color(0xFFE6ECF2)

    val Success = Color(0xFF1FB47A)
    val Warning = Color(0xFFF0A23B)
    val Danger = Color(0xFFE5563E)
    val PendingAmber = Color(0xFFE8973A)

    val BrandGradient = Brush.linearGradient(listOf(AccentGreen, Teal, Blue))
    val HeroGradient = Brush.linearGradient(
        listOf(Color(0xFF0FB9A8), Color(0xFF0E8FB8), Color(0xFF1A6FE0))
    )
}

val CardShape = RoundedCornerShape(20.dp)
val ChipShape = RoundedCornerShape(14.dp)

/** Parses "#0FB9A8" / "0FB9A8" hex strings from the backend into a Compose Color. */
fun parseHexColor(hex: String?, fallback: Color = AppColors.Teal): Color {
    val h = hex?.trim()?.removePrefix("#") ?: return fallback
    return try {
        when (h.length) {
            3 -> {
                val expanded = h.map { "$it$it" }.joinToString("")
                Color(0xFF000000L or expanded.toLong(16))
            }
            6 -> Color(0xFF000000L or h.toLong(16))
            8 -> Color(h.toULong(16).toLong())
            else -> fallback
        }
    } catch (_: NumberFormatException) {
        fallback
    }
}

private val LightColorScheme = lightColorScheme(
    primary = AppColors.Teal,
    onPrimary = Color.White,
    secondary = AppColors.Blue,
    onSecondary = Color.White,
    background = AppColors.Canvas,
    onBackground = AppColors.Ink,
    surface = AppColors.Surface,
    onSurface = AppColors.Ink,
    surfaceVariant = AppColors.Canvas,
    onSurfaceVariant = AppColors.InkSecondary,
    outline = AppColors.Stroke,
    error = AppColors.Danger,
    onError = Color.White,
)

@Composable
fun AppTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = LightColorScheme,
        content = content
    )
}
