package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MonitorHeart
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors

@Composable
fun SplashScreen(modifier: Modifier = Modifier) {
    var appear by remember { mutableStateOf(false) }
    val scale by animateFloatAsState(
        targetValue = if (appear) 1f else 0.7f,
        animationSpec = spring(dampingRatio = 0.6f),
        label = "splashScale",
    )
    val alphaValue by animateFloatAsState(targetValue = if (appear) 1f else 0f, label = "splashAlpha")

    LaunchedEffect(Unit) { appear = true }

    Box(
        modifier = modifier.fillMaxSize().background(AppColors.HeroGradient),
        contentAlignment = Alignment.Center,
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(22.dp),
        ) {
            Box(
                modifier = Modifier
                    .size(116.dp)
                    .scale(scale)
                    .alpha(alphaValue)
                    .background(Color.White, CircleShape),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    Icons.Filled.MonitorHeart,
                    contentDescription = "Asistan",
                    tint = AppColors.Teal,
                    modifier = Modifier.size(56.dp),
                )
            }
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(6.dp),
                modifier = Modifier.alpha(alphaValue),
            ) {
                Text(
                    "Asistan",
                    fontSize = 38.sp,
                    fontWeight = FontWeight.Black,
                    color = Color.White,
                )
                Text(
                    "Hızlı ve güvenli randevu",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color.White.copy(alpha = 0.9f),
                )
            }
        }
        CircularProgressIndicator(
            color = Color.White,
            strokeWidth = 2.5.dp,
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(bottom = 50.dp)
                .size(28.dp)
                .alpha(alphaValue),
        )
    }
}
