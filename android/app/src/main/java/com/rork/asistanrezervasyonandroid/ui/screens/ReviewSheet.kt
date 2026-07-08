package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Send
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.material3.rememberModalBottomSheetState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.rork.asistanrezervasyonandroid.data.ApiException
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.AppointmentRow
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ReviewSheet(
    appointment: AppointmentRow,
    onDismiss: () -> Unit,
    onSubmitted: () -> Unit,
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val scope = rememberCoroutineScope()

    var rating by remember { mutableIntStateOf(5) }
    var serviceQuality by remember { mutableIntStateOf(5) }
    var waitingTime by remember { mutableIntStateOf(5) }
    var communication by remember { mutableIntStateOf(5) }
    var comment by remember { mutableStateOf("") }
    var isSubmitting by remember { mutableStateOf(false) }
    var errorText by remember { mutableStateOf<String?>(null) }

    fun submit() {
        errorText = null
        isSubmitting = true
        scope.launch {
            try {
                ApiService.submitReview(
                    appointmentId = appointment.id,
                    rating = rating,
                    comment = comment.trim().ifEmpty { null },
                    serviceQuality = serviceQuality,
                    waitingTime = waitingTime,
                    communication = communication,
                )
                isSubmitting = false
                onSubmitted()
            } catch (e: ApiException) {
                isSubmitting = false
                errorText = e.message
            } catch (_: Exception) {
                isSubmitting = false
                errorText = "Değerlendirme gönderilemedi."
            }
        }
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = sheetState,
        containerColor = AppColors.Canvas,
    ) {
        Column(modifier = Modifier.navigationBarsPadding()) {
            Text(
                "Değerlendirme",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            )
            Column(
                modifier = Modifier
                    .weight(1f, fill = false)
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = 20.dp),
                verticalArrangement = Arrangement.spacedBy(22.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        appointment.service?.name ?: "Randevu",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Black,
                        color = AppColors.Ink,
                    )
                    appointment.teamMember?.fullName?.let { doctor ->
                        Text(doctor, fontSize = 14.sp, color = AppColors.InkSecondary)
                    }
                }

                Column(
                    modifier = Modifier.fillMaxWidth().asistanCard(padding = 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Text("Genel puanınız", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = AppColors.InkSecondary)
                    StarPicker(value = rating, size = 38.dp) { rating = it }
                }

                Column(
                    modifier = Modifier.fillMaxWidth().asistanCard(),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                ) {
                    RatingRow("Hizmet kalitesi", serviceQuality) { serviceQuality = it }
                    HorizontalDivider(color = AppColors.Stroke)
                    RatingRow("Bekleme süresi", waitingTime) { waitingTime = it }
                    HorizontalDivider(color = AppColors.Stroke)
                    RatingRow("İletişim", communication) { communication = it }
                }

                Column(modifier = Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text(
                        "Yorumunuz (opsiyonel)",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = AppColors.InkSecondary,
                    )
                    OutlinedTextField(
                        value = comment,
                        onValueChange = { comment = it },
                        placeholder = { Text("Deneyiminizi paylaşın", fontSize = 15.sp, color = AppColors.InkTertiary) },
                        minLines = 4,
                        maxLines = 8,
                        shape = RoundedCornerShape(12.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = AppColors.Teal,
                            unfocusedBorderColor = AppColors.Stroke,
                            focusedContainerColor = AppColors.Surface,
                            unfocusedContainerColor = AppColors.Surface,
                        ),
                        modifier = Modifier.fillMaxWidth(),
                    )
                }

                errorText?.let { err ->
                    Text(err, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = AppColors.Danger)
                }
            }

            PrimaryButton(
                title = "Değerlendirmeyi gönder",
                icon = Icons.AutoMirrored.Filled.Send,
                isLoading = isSubmitting,
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 12.dp),
            ) { submit() }
        }
    }
}

@Composable
private fun RatingRow(label: String, value: Int, onChange: (Int) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(label, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = AppColors.Ink)
        Spacer(modifier = Modifier.weight(1f))
        StarPicker(value = value, size = 22.dp, onChange = onChange)
    }
}

@Composable
private fun StarPicker(value: Int, size: Dp, onChange: (Int) -> Unit) {
    val haptics = LocalHapticFeedback.current
    Row(horizontalArrangement = Arrangement.spacedBy(size * 0.2f)) {
        (1..5).forEach { i ->
            Icon(
                Icons.Filled.Star,
                contentDescription = "$i yıldız",
                tint = if (i <= value) AppColors.Warning else AppColors.Stroke,
                modifier = Modifier
                    .size(size)
                    .pressableClickable {
                        haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                        onChange(i)
                    },
            )
        }
    }
}
