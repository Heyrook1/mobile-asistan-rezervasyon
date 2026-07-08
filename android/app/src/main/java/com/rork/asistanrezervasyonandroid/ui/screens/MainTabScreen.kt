package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors

enum class MainTab(val title: String, val icon: ImageVector) {
    HOME("Ana Sayfa", Icons.Filled.Home),
    SEARCH("Ara", Icons.Filled.Search),
    APPOINTMENTS("Randevularım", Icons.Filled.CalendarMonth),
    NOTIFICATIONS("Bildirimler", Icons.Filled.Notifications),
    PROFILE("Profil", Icons.Filled.Person),
}

@Composable
fun MainTabScreen(
    auth: AuthViewModel,
    onOpenDoctor: (String) -> Unit,
    onOpenClinic: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    var selectedIndex by rememberSaveable { mutableIntStateOf(0) }
    val selected = MainTab.entries[selectedIndex]
    val notifModel: NotificationsViewModel = viewModel()
    val unread by notifModel.unread.collectAsStateWithLifecycle()
    val haptics = LocalHapticFeedback.current

    LaunchedEffect(Unit) { notifModel.loadIfNeeded() }

    Box(modifier = modifier.fillMaxSize().background(AppColors.Canvas)) {
        Box(modifier = Modifier.fillMaxSize()) {
            when (selected) {
                MainTab.HOME -> HomeScreen(
                    auth = auth,
                    onOpenDoctor = onOpenDoctor,
                    onOpenSearch = { selectedIndex = MainTab.SEARCH.ordinal },
                )
                MainTab.SEARCH -> SearchScreen(auth = auth, onOpenDoctor = onOpenDoctor)
                MainTab.APPOINTMENTS -> AppointmentsScreen()
                MainTab.NOTIFICATIONS -> NotificationsScreen(model = notifModel)
                MainTab.PROFILE -> ProfileScreen(auth = auth)
            }
        }

        // Custom bottom tab bar mirroring the iOS design.
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(AppColors.Surface)
                .navigationBarsPadding(),
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp, bottom = 8.dp)
                    .padding(horizontal = 6.dp),
            ) {
                MainTab.entries.forEach { tab ->
                    val isSelected = tab == selected
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .pressableClickable {
                                if (!isSelected) haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                                selectedIndex = tab.ordinal
                            },
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(4.dp),
                    ) {
                        Box {
                            Icon(
                                tab.icon,
                                contentDescription = tab.title,
                                tint = if (isSelected) AppColors.Teal else AppColors.InkTertiary,
                                modifier = Modifier.size(24.dp),
                            )
                            if (tab == MainTab.NOTIFICATIONS && unread > 0) {
                                Box(
                                    modifier = Modifier
                                        .offset(x = 14.dp, y = (-4).dp)
                                        .size(16.dp)
                                        .background(AppColors.Danger, CircleShape),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    Text(
                                        "${minOf(unread, 9)}",
                                        fontSize = 10.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color.White,
                                    )
                                }
                            }
                        }
                        Text(
                            tab.title,
                            fontSize = 10.sp,
                            fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Medium,
                            color = if (isSelected) AppColors.Teal else AppColors.InkTertiary,
                        )
                    }
                }
            }
        }
    }
}
