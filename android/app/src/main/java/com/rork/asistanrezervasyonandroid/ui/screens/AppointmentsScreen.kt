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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EventAvailable
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rork.asistanrezervasyonandroid.data.ApiException
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.AppointmentRow
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.ui.components.ClinicAvatar
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.SkeletonCard
import com.rork.asistanrezervasyonandroid.ui.components.StatusBadge
import com.rork.asistanrezervasyonandroid.ui.components.ToastStyle
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import com.rork.asistanrezervasyonandroid.ui.theme.parseHexColor
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class AppointmentsViewModel : ViewModel() {
    private val _appointments = MutableStateFlow<List<AppointmentRow>>(emptyList())
    val appointments: StateFlow<List<AppointmentRow>> = _appointments.asStateFlow()

    private val _isLoading = MutableStateFlow(true)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    fun loadIfNeeded() {
        if (_appointments.value.isEmpty()) {
            viewModelScope.launch { load() }
        }
    }

    suspend fun load() {
        _appointments.value = runCatching { ApiService.myAppointments() }
            .getOrDefault(_appointments.value)
        _isLoading.value = false
    }

    val upcoming: List<AppointmentRow>
        get() = _appointments.value
            .filter { it.status in listOf("SCHEDULED", "CONFIRMED") }
            .sortedWith(compareBy({ it.date }, { it.startTime }))

    val past: List<AppointmentRow>
        get() = _appointments.value.filter { it.status in listOf("COMPLETED", "NO_SHOW") }

    val cancelled: List<AppointmentRow>
        get() = _appointments.value.filter { it.status == "CANCELLED" }
}

private val tabTitles = listOf("Yaklaşan", "Geçmiş", "İptal")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AppointmentsScreen(modifier: Modifier = Modifier) {
    val model: AppointmentsViewModel = viewModel()
    val toast = LocalToast.current
    val scope = rememberCoroutineScope()

    val appointments by model.appointments.collectAsStateWithLifecycle()
    val isLoading by model.isLoading.collectAsStateWithLifecycle()
    var tab by rememberSaveable { mutableIntStateOf(0) }
    var cancelTarget by remember { mutableStateOf<AppointmentRow?>(null) }
    var reviewTarget by remember { mutableStateOf<AppointmentRow?>(null) }
    var refreshing by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) { model.loadIfNeeded() }

    val currentList = remember(appointments, tab) {
        when (tab) {
            0 -> model.upcoming
            1 -> model.past
            else -> model.cancelled
        }
    }

    fun cancelAppointment(appt: AppointmentRow) {
        scope.launch {
            try {
                ApiService.cancel(appt.id)
                model.load()
                toast.show("Randevunuz iptal edildi.", ToastStyle.SUCCESS)
            } catch (e: ApiException) {
                toast.show(e.message ?: "İptal işlemi başarısız.", ToastStyle.ERROR)
            } catch (_: Exception) {
                toast.show("İptal işlemi başarısız.", ToastStyle.ERROR)
            }
        }
        cancelTarget = null
    }

    Column(modifier = modifier.fillMaxSize().statusBarsPadding()) {
        Text(
            "Randevularım",
            fontSize = 28.sp,
            fontWeight = FontWeight.Black,
            color = AppColors.Ink,
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp, bottom = 14.dp),
        )

        // Segment bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 18.dp),
        ) {
            tabTitles.forEachIndexed { i, title ->
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .pressableClickable { tab = i },
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        title,
                        fontSize = 14.sp,
                        fontWeight = if (tab == i) FontWeight.Bold else FontWeight.Medium,
                        color = if (tab == i) AppColors.Teal else AppColors.InkTertiary,
                    )
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(3.dp)
                            .clip(CircleShape)
                            .background(if (tab == i) AppColors.Teal else Color.Transparent),
                    )
                }
            }
        }
        HorizontalDivider(color = AppColors.Stroke)

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
                    modifier = Modifier.padding(horizontal = 18.dp).padding(top = 14.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    repeat(3) { SkeletonCard(height = 130.dp) }
                }
                currentList.isEmpty() -> Box(modifier = Modifier.fillMaxSize()) {
                    EmptyStateView(
                        icon = when (tab) {
                            0 -> Icons.Filled.EventAvailable
                            1 -> Icons.Filled.History
                            else -> Icons.Filled.EventBusy
                        },
                        title = when (tab) {
                            0 -> "Yaklaşan randevu yok"
                            1 -> "Geçmiş randevu yok"
                            else -> "İptal edilen randevu yok"
                        },
                        message = when (tab) {
                            0 -> "Ana sayfadan bir klinik seçerek hemen randevu alabilirsiniz."
                            1 -> "Tamamlanan randevularınız burada görünecek."
                            else -> "İptal ettiğiniz randevular burada listelenir."
                        },
                        modifier = Modifier.padding(top = 50.dp),
                    )
                }
                else -> LazyColumn(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(
                        start = 18.dp, end = 18.dp, top = 14.dp, bottom = 110.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    items(currentList, key = { it.id }) { appt ->
                        AppointmentCard(
                            appt = appt,
                            onCancel = if (appt.status in listOf("SCHEDULED", "CONFIRMED")) {
                                { cancelTarget = appt }
                            } else null,
                            onReview = if (appt.status == "COMPLETED" && !appt.hasReview) {
                                { reviewTarget = appt }
                            } else null,
                        )
                    }
                }
            }
        }
    }

    // Cancel confirmation
    cancelTarget?.let { target ->
        AlertDialog(
            onDismissRequest = { cancelTarget = null },
            title = { Text("Randevuyu iptal et?", fontWeight = FontWeight.Bold) },
            text = { Text("Bu randevuyu iptal etmek istediğinize emin misiniz?") },
            confirmButton = {
                TextButton(onClick = { cancelAppointment(target) }) {
                    Text("Randevuyu iptal et", color = AppColors.Danger, fontWeight = FontWeight.Bold)
                }
            },
            dismissButton = {
                TextButton(onClick = { cancelTarget = null }) {
                    Text("Vazgeç", color = AppColors.InkSecondary)
                }
            },
            containerColor = AppColors.Surface,
        )
    }

    // Review sheet
    reviewTarget?.let { target ->
        ReviewSheet(
            appointment = target,
            onDismiss = { reviewTarget = null },
            onSubmitted = {
                reviewTarget = null
                scope.launch { model.load() }
                toast.show("Değerlendirmeniz için teşekkürler!", ToastStyle.SUCCESS)
            },
        )
    }
}

@Composable
private fun AppointmentCard(
    appt: AppointmentRow,
    onCancel: (() -> Unit)?,
    onReview: (() -> Unit)?,
) {
    val tint = parseHexColor(appt.business?.primaryColor)
    Column(
        modifier = Modifier.fillMaxWidth().asistanCard(),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Row(verticalAlignment = Alignment.Top, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            ClinicAvatar(
                logoUrl = appt.business?.logoUrl,
                name = appt.business?.name ?: "Klinik",
                tint = tint,
                size = 48.dp,
            )
            Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                Text(
                    appt.service?.name ?: "Randevu",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.Ink,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
                appt.teamMember?.fullName?.let { doctor ->
                    Text(
                        doctor,
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Medium,
                        color = tint,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
                Text(
                    appt.business?.name ?: "",
                    fontSize = 12.sp,
                    color = AppColors.InkSecondary,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                )
            }
            StatusBadge(status = appt.status)
        }

        Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
            InfoChip(Icons.Filled.CalendarMonth, Format.shortDate(appt.date), tint)
            InfoChip(Icons.Filled.Schedule, "${Format.hhmm(appt.startTime)} - ${Format.hhmm(appt.endTime)}", tint)
            appt.price?.takeIf { it > 0 }?.let {
                InfoChip(Icons.Filled.Sell, Format.price(it), tint)
            }
        }

        if (!appt.notes.isNullOrEmpty()) {
            Text(
                appt.notes,
                fontSize = 12.5.sp,
                color = AppColors.InkSecondary,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(AppColors.Canvas)
                    .padding(10.dp),
            )
        }

        if (onCancel != null || onReview != null) {
            HorizontalDivider(color = AppColors.Stroke)
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                if (onReview != null) {
                    ActionButton(
                        title = "Değerlendir",
                        icon = Icons.Filled.Star,
                        contentColor = Color.White,
                        gradient = true,
                        modifier = Modifier.weight(1f),
                        onClick = onReview,
                    )
                }
                if (onCancel != null) {
                    ActionButton(
                        title = "İptal et",
                        icon = Icons.Filled.Close,
                        contentColor = AppColors.Danger,
                        gradient = false,
                        modifier = Modifier.weight(1f),
                        onClick = onCancel,
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionButton(
    title: String,
    icon: ImageVector,
    contentColor: Color,
    gradient: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Row(
        modifier = modifier
            .height(40.dp)
            .clip(RoundedCornerShape(11.dp))
            .then(
                if (gradient) Modifier.background(AppColors.BrandGradient)
                else Modifier.background(AppColors.Danger.copy(alpha = 0.1f))
            )
            .pressableClickable { onClick() },
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        Icon(icon, contentDescription = null, tint = contentColor, modifier = Modifier.size(15.dp))
        Spacer(modifier = Modifier.size(6.dp))
        Text(title, fontSize = 13.sp, fontWeight = FontWeight.Bold, color = contentColor)
    }
}

@Composable
private fun InfoChip(icon: ImageVector, text: String, tint: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(13.dp))
        Text(text, fontSize = 12.5.sp, fontWeight = FontWeight.SemiBold, color = AppColors.InkSecondary)
    }
}
