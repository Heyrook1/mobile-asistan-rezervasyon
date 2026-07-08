package com.rork.asistanrezervasyonandroid.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class ToastStyle { SUCCESS, ERROR, INFO }

data class ToastData(val message: String, val style: ToastStyle)

/** Top-anchored transient toast, mirroring the iOS ToastCenter overlay. */
class ToastState(private val scope: CoroutineScope) {
    var current: ToastData? by mutableStateOf(null)
        private set
    private var job: Job? = null

    fun show(message: String, style: ToastStyle = ToastStyle.INFO) {
        current = ToastData(message, style)
        job?.cancel()
        job = scope.launch {
            delay(3000)
            current = null
        }
    }
}

val LocalToast = staticCompositionLocalOf<ToastState> {
    error("ToastState not provided")
}

@Composable
fun ToastOverlay(state: ToastState, modifier: Modifier = Modifier) {
    Box(modifier = modifier.fillMaxWidth().statusBarsPadding(), contentAlignment = Alignment.TopCenter) {
        AnimatedVisibility(
            visible = state.current != null,
            enter = slideInVertically(initialOffsetY = { -it }) + fadeIn(),
            exit = slideOutVertically(targetOffsetY = { -it }) + fadeOut(),
        ) {
            val toast = state.current ?: return@AnimatedVisibility
            val color = when (toast.style) {
                ToastStyle.SUCCESS -> AppColors.Success
                ToastStyle.ERROR -> AppColors.Danger
                ToastStyle.INFO -> AppColors.Ink
            }
            val icon = when (toast.style) {
                ToastStyle.SUCCESS -> Icons.Filled.CheckCircle
                ToastStyle.ERROR -> Icons.Filled.Warning
                ToastStyle.INFO -> Icons.Filled.Info
            }
            Row(
                modifier = Modifier
                    .padding(horizontal = 24.dp, vertical = 8.dp)
                    .background(color, CircleShape)
                    .padding(horizontal = 16.dp, vertical = 13.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.padding(end = 10.dp))
                Text(
                    toast.message,
                    color = Color.White,
                    fontSize = 14.sp,
                    fontWeight = FontWeight.SemiBold,
                )
            }
        }
    }
}
