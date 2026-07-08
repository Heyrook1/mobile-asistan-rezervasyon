package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.NotificationsOff
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.rork.asistanrezervasyonandroid.data.ClientNotificationItem
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.SkeletonCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(model: NotificationsViewModel, modifier: Modifier = Modifier) {
    val notifications by model.notifications.collectAsStateWithLifecycle()
    val unread by model.unread.collectAsStateWithLifecycle()
    val isLoading by model.isLoading.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var refreshing by remember { mutableStateOf(false) }

    Column(modifier = modifier.fillMaxSize().statusBarsPadding()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp, bottom = 14.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Bildirimler", fontSize = 28.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
            Spacer(modifier = Modifier.weight(1f))
            if (unread > 0) {
                Text(
                    "Tümünü okundu işaretle",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.Teal,
                    modifier = Modifier.pressableClickable { model.markAllRead() }.padding(4.dp),
                )
            }
        }

        PullToRefreshBox(
            isRefreshing = refreshing,
            onRefresh = {
                scope.launch {
                    refreshing = true
                    model.load()
                    refreshing = false
                }
            },
            modifier = Modifier.fillMaxSize(),
        ) {
            when {
                isLoading -> Column(
                    modifier = Modifier.padding(horizontal = 18.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    repeat(4) { SkeletonCard(height = 84.dp) }
                }
                notifications.isEmpty() -> Box(modifier = Modifier.fillMaxSize()) {
                    EmptyStateView(
                        icon = Icons.Filled.NotificationsOff,
                        title = "Bildirim yok",
                        message = "Randevu güncellemeleriniz ve klinik mesajları burada görünecek.",
                        modifier = Modifier.padding(top = 50.dp),
                    )
                }
                else -> LazyColumn(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        start = 18.dp, end = 18.dp, bottom = 110.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(notifications, key = { it.id }) { item ->
                        NotificationRow(item = item) { model.markRead(item) }
                    }
                }
            }
        }
    }
}

@Composable
private fun NotificationRow(item: ClientNotificationItem, onClick: () -> Unit) {
    val (icon, color) = when (item.type) {
        "BOOKING_APPROVED", "BOOKING_CONFIRMATION" -> Icons.Filled.CheckCircle to AppColors.Success
        "BOOKING_PENDING" -> Icons.Filled.Schedule to AppColors.PendingAmber
        "BOOKING_CANCELLED" -> Icons.Filled.Cancel to AppColors.Danger
        "BOOKING_RESCHEDULED" -> Icons.Filled.SwapHoriz to AppColors.Blue
        "APPOINTMENT_REMINDER" -> Icons.Filled.NotificationsActive to AppColors.Teal
        "REVIEW_REQUEST" -> Icons.Filled.Star to AppColors.Warning
        else -> Icons.Filled.Info to AppColors.InkSecondary
    }
    val shape = RoundedCornerShape(16.dp)
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(shape)
            .background(if (item.isRead) AppColors.Surface else AppColors.Teal.copy(alpha = 0.04f))
            .border(
                1.dp,
                if (item.isRead) AppColors.Stroke else AppColors.Teal.copy(alpha = 0.25f),
                shape,
            )
            .pressableClickable { onClick() }
            .padding(14.dp),
        verticalAlignment = Alignment.Top,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Box(
            modifier = Modifier.size(44.dp).background(color.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(icon, contentDescription = null, tint = color, modifier = Modifier.size(20.dp))
        }
        Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(3.dp)) {
            Text(item.title, fontSize = 14.5.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
            Text(item.message, fontSize = 13.sp, color = AppColors.InkSecondary)
            Text(
                Format.relativeTime(item.createdAt),
                fontSize = 11.sp,
                color = AppColors.InkTertiary,
                modifier = Modifier.padding(top = 1.dp),
            )
        }
        if (!item.isRead) {
            Box(
                modifier = Modifier
                    .padding(top = 4.dp)
                    .size(9.dp)
                    .background(AppColors.Teal, CircleShape),
            )
        }
    }
}
