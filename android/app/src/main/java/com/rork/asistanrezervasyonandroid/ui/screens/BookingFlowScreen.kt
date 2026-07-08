package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.EventBusy
import androidx.compose.material.icons.filled.ListAlt
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.RadioButtonUnchecked
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Sell
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.hapticfeedback.HapticFeedbackType
import androidx.compose.ui.platform.LocalHapticFeedback
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rork.asistanrezervasyonandroid.data.ApiException
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.BookingResponse
import com.rork.asistanrezervasyonandroid.data.Format
import com.rork.asistanrezervasyonandroid.data.Provider
import com.rork.asistanrezervasyonandroid.data.ServiceItem
import com.rork.asistanrezervasyonandroid.data.SlotItem
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.PrimaryButton
import com.rork.asistanrezervasyonandroid.ui.components.ToastStyle
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class BookingViewModel : ViewModel() {
    private val _provider = MutableStateFlow<Provider?>(null)
    val provider: StateFlow<Provider?> = _provider.asStateFlow()

    private val _isLoadingProvider = MutableStateFlow(true)
    val isLoadingProvider: StateFlow<Boolean> = _isLoadingProvider.asStateFlow()

    val step = MutableStateFlow(0)
    val selectedService = MutableStateFlow<ServiceItem?>(null)
    val selectedDate = MutableStateFlow<String?>(null)
    val selectedSlot = MutableStateFlow<SlotItem?>(null)
    val note = MutableStateFlow("")
    val contactPhone = MutableStateFlow("")

    private val _slots = MutableStateFlow<List<SlotItem>>(emptyList())
    val slots: StateFlow<List<SlotItem>> = _slots.asStateFlow()

    private val _loadingSlots = MutableStateFlow(false)
    val loadingSlots: StateFlow<Boolean> = _loadingSlots.asStateFlow()

    private val _isBooking = MutableStateFlow(false)
    val isBooking: StateFlow<Boolean> = _isBooking.asStateFlow()

    private val _bookingResult = MutableStateFlow<BookingResponse?>(null)
    val bookingResult: StateFlow<BookingResponse?> = _bookingResult.asStateFlow()

    val dateOptions: List<String> = Format.dateOptions(14)

    fun loadProvider(staffId: String, lat: Double?, lng: Double?, defaultPhone: String?) {
        if (_provider.value != null) return
        viewModelScope.launch {
            runCatching {
                val res = ApiService.doctor(staffId, lat, lng)
                _provider.value = res.doctor
                if (res.doctor?.services?.size == 1) {
                    selectedService.value = res.doctor.services.first()
                }
            }
            if (contactPhone.value.isEmpty() && !defaultPhone.isNullOrEmpty()) {
                contactPhone.value = defaultPhone
            }
            _isLoadingProvider.value = false
        }
    }

    fun loadSlots() {
        val provider = _provider.value ?: return
        val service = selectedService.value ?: return
        val date = selectedDate.value ?: return
        viewModelScope.launch {
            _loadingSlots.value = true
            selectedSlot.value = null
            _slots.value = runCatching {
                ApiService.slots(provider.staffId, service.id, date)
            }.getOrDefault(emptyList())
            _loadingSlots.value = false
        }
    }

    /** Throws ApiException with a Turkish message on failure. */
    suspend fun confirm() {
        val provider = _provider.value ?: return
        val service = selectedService.value ?: return
        val date = selectedDate.value ?: return
        val slot = selectedSlot.value ?: return
        _isBooking.value = true
        try {
            _bookingResult.value = ApiService.book(
                businessId = provider.businessId,
                staffId = provider.staffId,
                serviceId = service.id,
                date = date,
                startTime = slot.startTime,
                note = note.value.trim().ifEmpty { null },
                contactPhone = contactPhone.value.trim().ifEmpty { null },
            )
        } finally {
            _isBooking.value = false
        }
    }
}

private val stepTitles = listOf("Hizmet", "Tarih", "Saat", "Bilgiler", "Onay")

@Composable
fun BookingFlowScreen(
    staffId: String,
    auth: AuthViewModel,
    onClose: () -> Unit,
    onDone: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val model: BookingViewModel = viewModel()
    val toast = LocalToast.current
    val scope = rememberCoroutineScope()
    val haptics = LocalHapticFeedback.current

    val provider by model.provider.collectAsStateWithLifecycle()
    val isLoadingProvider by model.isLoadingProvider.collectAsStateWithLifecycle()
    val step by model.step.collectAsStateWithLifecycle()
    val selectedService by model.selectedService.collectAsStateWithLifecycle()
    val selectedDate by model.selectedDate.collectAsStateWithLifecycle()
    val selectedSlot by model.selectedSlot.collectAsStateWithLifecycle()
    val note by model.note.collectAsStateWithLifecycle()
    val contactPhone by model.contactPhone.collectAsStateWithLifecycle()
    val slots by model.slots.collectAsStateWithLifecycle()
    val loadingSlots by model.loadingSlots.collectAsStateWithLifecycle()
    val isBooking by model.isBooking.collectAsStateWithLifecycle()
    val bookingResult by model.bookingResult.collectAsStateWithLifecycle()

    var errorText by remember { mutableStateOf<String?>(null) }
    val user by auth.clientUser.collectAsStateWithLifecycle()
    val coord = auth.coordinate

    LaunchedEffect(staffId) {
        model.loadProvider(staffId, coord?.first, coord?.second, user?.phone)
    }

    fun confirmBooking() {
        errorText = null
        scope.launch {
            try {
                model.confirm()
                haptics.performHapticFeedback(HapticFeedbackType.LongPress)
            } catch (e: ApiException) {
                val msg = e.message ?: "Randevu oluşturulamadı."
                errorText = msg
                // If the slot was taken, send the user back to slot selection.
                if (msg.contains("doldu")) {
                    model.loadSlots()
                    model.step.value = 2
                    toast.show(msg, ToastStyle.ERROR)
                }
            } catch (_: Exception) {
                errorText = "Randevu oluşturulamadı. Lütfen tekrar deneyin."
            }
        }
    }

    Column(modifier = modifier.fillMaxSize().background(AppColors.Canvas).statusBarsPadding()) {
        val result = bookingResult
        if (result != null && provider != null) {
            BookingSuccessView(result = result, provider = provider!!, onDone = onDone)
            return@Column
        }

        // Top bar
        Row(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp, vertical = 4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Spacer(modifier = Modifier.size(48.dp))
            Text(
                "Randevu Al",
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = AppColors.Ink,
                textAlign = TextAlign.Center,
                modifier = Modifier.weight(1f),
            )
            IconButton(onClick = onClose) {
                Icon(Icons.Filled.Close, contentDescription = "Kapat", tint = AppColors.InkTertiary)
            }
        }

        if (isLoadingProvider) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppColors.Teal)
            }
            return@Column
        }
        val doc = provider
        if (doc == null) {
            EmptyStateView(
                icon = Icons.Filled.MedicalServices,
                title = "Uzman bulunamadı",
                message = "Bu profil artık mevcut değil.",
            )
            return@Column
        }

        // Progress bar
        Column(
            modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp).padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                stepTitles.indices.forEach { i ->
                    val color by animateColorAsState(
                        targetValue = if (i <= step) AppColors.Teal else AppColors.Stroke,
                        label = "stepColor",
                    )
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(5.dp)
                            .clip(CircleShape)
                            .background(color),
                    )
                }
            }
            Row(modifier = Modifier.fillMaxWidth()) {
                Text(
                    "Adım ${step + 1}/${stepTitles.size}",
                    fontSize = 12.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = AppColors.InkTertiary,
                )
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    stepTitles[step],
                    fontSize = 12.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.Teal,
                )
            }
        }

        // Step content
        Column(
            modifier = Modifier
                .weight(1f)
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 20.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            when (step) {
                0 -> ServiceStep(doc, selectedService) { model.selectedService.value = it }
                1 -> DateStep(model.dateOptions, selectedDate) {
                    model.selectedDate.value = it
                    model.loadSlots()
                }
                2 -> SlotStep(selectedDate, slots, loadingSlots, selectedSlot) {
                    model.selectedSlot.value = it
                    haptics.performHapticFeedback(HapticFeedbackType.LongPress)
                }
                3 -> InfoStep(
                    phone = contactPhone,
                    note = note,
                    onPhoneChange = { model.contactPhone.value = it },
                    onNoteChange = { model.note.value = it },
                )
                else -> ConfirmStep(doc, selectedService, selectedDate, selectedSlot, errorText)
            }
        }

        // Bottom bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(AppColors.Surface)
                .navigationBarsPadding()
                .padding(horizontal = 20.dp)
                .padding(top = 12.dp, bottom = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (step > 0) {
                Box(
                    modifier = Modifier
                        .size(54.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(AppColors.Surface)
                        .border(1.dp, AppColors.Stroke, RoundedCornerShape(16.dp))
                        .pressableClickable { model.step.value = step - 1 },
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Geri", tint = AppColors.Ink, modifier = Modifier.size(20.dp))
                }
            }
            val canAdvance = when (step) {
                0 -> selectedService != null
                1 -> selectedDate != null
                2 -> selectedSlot != null
                else -> true
            }
            if (step < 4) {
                PrimaryButton(
                    title = "Devam et",
                    icon = Icons.AutoMirrored.Filled.ArrowForward,
                    enabled = canAdvance,
                    modifier = Modifier.weight(1f),
                ) { model.step.value = step + 1 }
            } else {
                PrimaryButton(
                    title = "Randevuyu Onayla",
                    icon = Icons.Filled.Check,
                    isLoading = isBooking,
                    modifier = Modifier.weight(1f),
                ) { confirmBooking() }
            }
        }
    }
}

@Composable
private fun StepHeader(title: String, subtitle: String) {
    Column(verticalArrangement = Arrangement.spacedBy(3.dp)) {
        Text(title, fontSize = 22.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
        if (subtitle.isNotEmpty()) {
            Text(subtitle, fontSize = 14.sp, color = AppColors.InkSecondary)
        }
    }
}

@Composable
private fun ServiceStep(
    doc: Provider,
    selected: ServiceItem?,
    onSelect: (ServiceItem) -> Unit,
) {
    StepHeader("Hizmet seçin", "Bu uzmanın sunduğu hizmetlerden birini seçin.")
    if (doc.services.isEmpty()) {
        EmptyStateView(
            icon = Icons.Filled.ListAlt,
            title = "Hizmet yok",
            message = "Bu uzman için tanımlı hizmet bulunmuyor.",
        )
    } else {
        doc.services.forEach { svc ->
            val isSelected = selected?.id == svc.id
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(14.dp))
                    .background(AppColors.Surface)
                    .border(
                        if (isSelected) 1.5.dp else 1.dp,
                        if (isSelected) AppColors.Teal else AppColors.Stroke,
                        RoundedCornerShape(14.dp),
                    )
                    .pressableClickable { onSelect(svc) }
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Icon(
                    if (isSelected) Icons.Filled.CheckCircle else Icons.Filled.RadioButtonUnchecked,
                    contentDescription = null,
                    tint = if (isSelected) AppColors.Teal else AppColors.Stroke,
                    modifier = Modifier.size(24.dp),
                )
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(svc.name, fontSize = 15.sp, fontWeight = FontWeight.Bold, color = AppColors.Ink)
                    Text("${svc.durationMin} dk", fontSize = 12.5.sp, color = AppColors.InkTertiary)
                }
                Text(
                    Format.price(svc.price, svc.currency),
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = AppColors.Teal,
                )
            }
        }
    }
}

@Composable
private fun DateStep(dates: List<String>, selected: String?, onSelect: (String) -> Unit) {
    StepHeader("Tarih seçin", "Randevu almak istediğiniz günü seçin.")
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        dates.chunked(4).forEach { rowDates ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                rowDates.forEach { date ->
                    val isSelected = selected == date
                    val parts = date.split("-")
                    val day = if (parts.size == 3) parts[2].trimStart('0').ifEmpty { "0" } else ""
                    val label = Format.shortDate(date).split(" ")
                    val month = if (label.size >= 2) label[1] else ""
                    val weekday = if (label.size >= 3) label[2] else ""
                    Column(
                        modifier = Modifier
                            .weight(1f)
                            .height(72.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .then(
                                if (isSelected) Modifier.background(AppColors.BrandGradient)
                                else Modifier
                                    .background(AppColors.Surface)
                                    .border(1.dp, AppColors.Stroke, RoundedCornerShape(14.dp))
                            )
                            .pressableClickable { onSelect(date) },
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center,
                    ) {
                        val textColor = if (isSelected) Color.White else AppColors.Ink
                        Text(weekday, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, color = textColor)
                        Text(day, fontSize = 19.sp, fontWeight = FontWeight.Black, color = textColor)
                        Text(month, fontSize = 10.sp, color = textColor)
                    }
                }
                repeat(4 - rowDates.size) { Spacer(modifier = Modifier.weight(1f)) }
            }
        }
    }
}

@Composable
private fun SlotStep(
    selectedDate: String?,
    slots: List<SlotItem>,
    loading: Boolean,
    selected: SlotItem?,
    onSelect: (SlotItem) -> Unit,
) {
    StepHeader("Saat seçin", selectedDate?.let { Format.shortDate(it) } ?: "")
    when {
        loading -> Box(
            modifier = Modifier.fillMaxWidth().padding(vertical = 40.dp),
            contentAlignment = Alignment.Center,
        ) {
            CircularProgressIndicator(color = AppColors.Teal)
        }
        slots.isEmpty() -> EmptyStateView(
            icon = Icons.Filled.EventBusy,
            title = "Uygun saat yok",
            message = "Bu gün için boş randevu bulunmuyor. Lütfen başka bir gün seçin.",
        )
        else -> Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            slots.chunked(3).forEach { rowSlots ->
                Row(horizontalArrangement = Arrangement.spacedBy(10.dp), modifier = Modifier.fillMaxWidth()) {
                    rowSlots.forEach { slot ->
                        val isSelected = selected?.startTime == slot.startTime
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .height(48.dp)
                                .clip(RoundedCornerShape(12.dp))
                                .then(
                                    if (isSelected) Modifier.background(AppColors.BrandGradient)
                                    else Modifier
                                        .background(AppColors.Surface)
                                        .border(1.dp, AppColors.Stroke, RoundedCornerShape(12.dp))
                                )
                                .pressableClickable { onSelect(slot) },
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                slot.startTime,
                                fontSize = 15.sp,
                                fontWeight = FontWeight.Bold,
                                color = if (isSelected) Color.White else AppColors.Ink,
                            )
                        }
                    }
                    repeat(3 - rowSlots.size) { Spacer(modifier = Modifier.weight(1f)) }
                }
            }
        }
    }
}

@Composable
private fun InfoStep(
    phone: String,
    note: String,
    onPhoneChange: (String) -> Unit,
    onNoteChange: (String) -> Unit,
) {
    StepHeader("İletişim & not", "Klinik sizinle iletişime geçebilir.")
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Telefon", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.InkSecondary)
        OutlinedTextField(
            value = phone,
            onValueChange = onPhoneChange,
            placeholder = { Text("Telefon numaranız", fontSize = 15.sp, color = AppColors.InkTertiary) },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            shape = RoundedCornerShape(12.dp),
            colors = bookingFieldColors(),
            modifier = Modifier.fillMaxWidth(),
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Not (opsiyonel)", fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = AppColors.InkSecondary)
        OutlinedTextField(
            value = note,
            onValueChange = onNoteChange,
            placeholder = { Text("Şikayetiniz veya notunuz", fontSize = 15.sp, color = AppColors.InkTertiary) },
            minLines = 3,
            maxLines = 6,
            shape = RoundedCornerShape(12.dp),
            colors = bookingFieldColors(),
            modifier = Modifier.fillMaxWidth(),
        )
    }
}

@Composable
private fun bookingFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = AppColors.Teal,
    unfocusedBorderColor = AppColors.Stroke,
    focusedContainerColor = AppColors.Surface,
    unfocusedContainerColor = AppColors.Surface,
)

@Composable
private fun ConfirmStep(
    doc: Provider,
    service: ServiceItem?,
    date: String?,
    slot: SlotItem?,
    errorText: String?,
) {
    StepHeader("Randevuyu onayla", "Bilgileri kontrol edin ve onaylayın.")
    Column(modifier = Modifier.fillMaxWidth().asistanCard()) {
        SummaryRow(Icons.Filled.Person, "Uzman", doc.doctorName)
        SummaryDivider()
        SummaryRow(Icons.Filled.MedicalServices, "Klinik", doc.clinicName)
        SummaryDivider()
        SummaryRow(Icons.Filled.ListAlt, "Hizmet", service?.name ?: "-")
        SummaryDivider()
        SummaryRow(Icons.Filled.CalendarMonth, "Tarih", date?.let { Format.shortDate(it) } ?: "-")
        SummaryDivider()
        SummaryRow(Icons.Filled.Schedule, "Saat", slot?.let { "${it.startTime} - ${it.endTime}" } ?: "-")
        if (service != null) {
            SummaryDivider()
            SummaryRow(Icons.Filled.Sell, "Ücret", Format.price(service.price, service.currency))
        }
    }

    val autoColor = if (doc.autoConfirm) AppColors.Success else AppColors.PendingAmber
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(autoColor.copy(alpha = 0.1f))
            .padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(
            if (doc.autoConfirm) Icons.Filled.CheckCircle else Icons.Filled.Schedule,
            contentDescription = null,
            tint = autoColor,
            modifier = Modifier.size(20.dp),
        )
        Text(
            if (doc.autoConfirm) "Randevunuz anında onaylanacak." else "Randevunuz klinik onayına gönderilecek.",
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = AppColors.InkSecondary,
        )
    }

    if (errorText != null) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            Icon(Icons.Filled.Warning, contentDescription = null, tint = AppColors.Danger, modifier = Modifier.size(16.dp))
            Text(errorText, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = AppColors.Danger)
        }
    }
}

@Composable
private fun SummaryDivider() {
    HorizontalDivider(color = AppColors.Stroke, modifier = Modifier.padding(start = 44.dp))
}

@Composable
private fun SummaryRow(icon: ImageVector, label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 11.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(18.dp))
        Text(label, fontSize = 14.sp, color = AppColors.InkSecondary)
        Spacer(modifier = Modifier.weight(1f))
        Text(
            value,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = AppColors.Ink,
            textAlign = TextAlign.End,
        )
    }
}

@Composable
private fun BookingSuccessView(
    result: BookingResponse,
    provider: Provider,
    onDone: () -> Unit,
) {
    val confirmed = result.status == "CONFIRMED"
    val color = if (confirmed) AppColors.Success else AppColors.PendingAmber
    Column(
        modifier = Modifier.fillMaxSize().navigationBarsPadding(),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Spacer(modifier = Modifier.weight(1f))
        Box(
            modifier = Modifier.size(130.dp).background(color.copy(alpha = 0.12f), CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            Icon(
                if (confirmed) Icons.Filled.CheckCircle else Icons.Filled.Schedule,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(64.dp),
            )
        }
        Spacer(modifier = Modifier.height(22.dp))
        Text(
            if (confirmed) "Randevunuz onaylandı!" else "Talebiniz alındı!",
            fontSize = 24.sp,
            fontWeight = FontWeight.Black,
            color = AppColors.Ink,
        )
        Text(
            if (confirmed) "Randevunuz başarıyla oluşturuldu." else "Klinik onayladığında bildirim alacaksınız.",
            fontSize = 15.sp,
            color = AppColors.InkSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.padding(top = 8.dp),
        )
        Spacer(modifier = Modifier.height(22.dp))
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 24.dp)
                .asistanCard(),
        ) {
            SuccessRow(Icons.Filled.Person, provider.doctorName)
            SummaryDivider()
            SuccessRow(Icons.Filled.CalendarMonth, Format.shortDate(result.date))
            SummaryDivider()
            SuccessRow(Icons.Filled.Schedule, "${result.startTime} - ${result.endTime}")
        }
        Spacer(modifier = Modifier.weight(1f))
        PrimaryButton(
            title = "Randevularıma git",
            icon = Icons.Filled.CalendarMonth,
            modifier = Modifier.padding(horizontal = 24.dp).padding(bottom = 28.dp),
        ) { onDone() }
    }
}

@Composable
private fun SuccessRow(icon: ImageVector, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        Icon(icon, contentDescription = null, tint = AppColors.Teal, modifier = Modifier.size(18.dp))
        Text(value, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = AppColors.Ink)
    }
}
