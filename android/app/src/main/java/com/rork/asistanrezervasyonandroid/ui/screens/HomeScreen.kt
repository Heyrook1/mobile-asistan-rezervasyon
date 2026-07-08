package com.rork.asistanrezervasyonandroid.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
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
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AutoAwesome
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Place
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.WifiOff
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.material3.pulltorefresh.PullToRefreshBox
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.lifecycle.viewModelScope
import com.rork.asistanrezervasyonandroid.data.ApiException
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.DiscoveryResponse
import com.rork.asistanrezervasyonandroid.data.PopularService
import com.rork.asistanrezervasyonandroid.data.Provider
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.CompactProviderCard
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.ProviderCard
import com.rork.asistanrezervasyonandroid.ui.components.SkeletonCard
import com.rork.asistanrezervasyonandroid.ui.components.asistanCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class HomeViewModel : ViewModel() {
    private val _data = MutableStateFlow<DiscoveryResponse?>(null)
    val data: StateFlow<DiscoveryResponse?> = _data.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage.asStateFlow()

    fun load(lat: Double?, lng: Double?, force: Boolean = false) {
        if (_data.value != null && !force) return
        viewModelScope.launch { loadNow(lat, lng) }
    }

    suspend fun loadNow(lat: Double?, lng: Double?) {
        _isLoading.value = _data.value == null
        _errorMessage.value = null
        try {
            _data.value = ApiService.discovery(lat, lng)
        } catch (e: ApiException) {
            _errorMessage.value = e.message
        } catch (_: Exception) {
            _errorMessage.value = "İçerik yüklenemedi."
        }
        _isLoading.value = false
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    auth: AuthViewModel,
    onOpenDoctor: (String) -> Unit,
    onOpenSearch: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val model: HomeViewModel = viewModel()
    val data by model.data.collectAsStateWithLifecycle()
    val isLoading by model.isLoading.collectAsStateWithLifecycle()
    val errorMessage by model.errorMessage.collectAsStateWithLifecycle()
    val user by auth.clientUser.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    var refreshing by remember { mutableStateOf(false) }

    val coord = auth.coordinate
    val firstName = (user?.fullName ?: "").split(" ").firstOrNull { it.isNotBlank() } ?: "Hoş geldiniz"

    LaunchedEffect(coord) { model.load(coord?.first, coord?.second) }

    PullToRefreshBox(
        isRefreshing = refreshing,
        onRefresh = {
            scope.launch {
                refreshing = true
                model.loadNow(coord?.first, coord?.second)
                refreshing = false
            }
        },
        modifier = modifier.fillMaxSize(),
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .statusBarsPadding()
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp),
            verticalArrangement = Arrangement.spacedBy(22.dp),
        ) {
            // Header
            Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                        Text(
                            "Merhaba, $firstName 👋",
                            fontSize = 22.sp,
                            fontWeight = FontWeight.Black,
                            color = AppColors.Ink,
                        )
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                            Icon(
                                Icons.Filled.LocationOn,
                                contentDescription = null,
                                tint = AppColors.InkSecondary,
                                modifier = Modifier.size(13.dp),
                            )
                            Text(
                                user?.city ?: "Konum seçilmedi",
                                fontSize = 13.sp,
                                fontWeight = FontWeight.Medium,
                                color = AppColors.InkSecondary,
                            )
                        }
                    }
                    Box(
                        modifier = Modifier.size(46.dp).clip(CircleShape).background(AppColors.BrandGradient),
                        contentAlignment = Alignment.Center,
                    ) {
                        Text(
                            firstName.take(1).uppercase(),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White,
                        )
                    }
                }

                // Search bar (routes to Search tab)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(16.dp))
                        .background(AppColors.Surface)
                        .border(1.dp, AppColors.Stroke, RoundedCornerShape(16.dp))
                        .pressableClickable { onOpenSearch() }
                        .padding(horizontal = 16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Icon(Icons.Filled.Search, contentDescription = null, tint = AppColors.InkTertiary, modifier = Modifier.size(20.dp))
                    Text("Doktor, klinik veya hizmet ara", fontSize = 15.sp, color = AppColors.InkTertiary)
                }
            }

            when {
                isLoading -> {
                    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                        repeat(3) { SkeletonCard(height = 150.dp) }
                    }
                }
                data != null -> HomeContent(
                    data = data!!,
                    onOpenDoctor = onOpenDoctor,
                    onOpenSearch = onOpenSearch,
                )
                errorMessage != null -> EmptyStateView(
                    icon = Icons.Filled.WifiOff,
                    title = "Bir şeyler ters gitti",
                    message = errorMessage ?: "",
                )
            }

            Spacer(modifier = Modifier.height(90.dp))
        }
    }
}

@Composable
private fun HomeContent(
    data: DiscoveryResponse,
    onOpenDoctor: (String) -> Unit,
    onOpenSearch: () -> Unit,
) {
    if (data.nearby.isEmpty()) {
        Box(modifier = Modifier.fillMaxWidth().asistanCard()) {
            EmptyStateView(
                icon = Icons.Filled.MedicalServices,
                title = "Yakında klinik bulunamadı",
                message = "Şu an bölgenizde aktif klinik yok. Daha sonra tekrar deneyin veya aramayı kullanın.",
            )
        }
        return
    }

    Column(verticalArrangement = Arrangement.spacedBy(22.dp)) {
        if (data.availableToday.isNotEmpty()) {
            HomeSection(title = "Bugün müsait", icon = Icons.Filled.Bolt, tint = AppColors.Success) {
                HorizontalProviders(data.availableToday, onOpenDoctor)
            }
        }

        if (data.popularServices.isNotEmpty()) {
            HomeSection(title = "Popüler hizmetler", icon = Icons.Filled.AutoAwesome, tint = AppColors.Blue) {
                Row(
                    modifier = Modifier.horizontalScroll(rememberScrollState()),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    data.popularServices.forEach { svc ->
                        ServiceChip(svc) { onOpenSearch() }
                    }
                }
            }
        }

        if (data.topRated.isNotEmpty()) {
            HomeSection(title = "En yüksek puanlı", icon = Icons.Filled.Star, tint = AppColors.Warning) {
                HorizontalProviders(data.topRated, onOpenDoctor)
            }
        }

        HomeSection(title = "Yakınındaki klinikler", icon = Icons.Filled.Place, tint = AppColors.Teal) {
            Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                data.nearby.forEach { provider ->
                    Box(modifier = Modifier.pressableClickable { onOpenDoctor(provider.staffId) }) {
                        ProviderCard(provider = provider)
                    }
                }
            }
        }
    }
}

@Composable
private fun HorizontalProviders(providers: List<Provider>, onOpenDoctor: (String) -> Unit) {
    Row(
        modifier = Modifier.horizontalScroll(rememberScrollState()),
        horizontalArrangement = Arrangement.spacedBy(14.dp),
    ) {
        providers.forEach { provider ->
            Box(modifier = Modifier.pressableClickable { onOpenDoctor(provider.staffId) }) {
                CompactProviderCard(provider = provider)
            }
        }
    }
}

@Composable
private fun ServiceChip(svc: PopularService, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .width(168.dp)
            .height(138.dp)
            .clip(RoundedCornerShape(18.dp))
            .background(AppColors.Surface)
            .border(1.dp, AppColors.Stroke, RoundedCornerShape(18.dp))
            .pressableClickable { onClick() }
            .padding(14.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        Icon(Icons.Filled.FavoriteBorder, contentDescription = null, tint = AppColors.Blue, modifier = Modifier.size(24.dp))
        Text(
            svc.name,
            fontSize = 14.sp,
            fontWeight = FontWeight.Bold,
            color = AppColors.Ink,
            maxLines = 2,
            overflow = TextOverflow.Ellipsis,
        )
        Spacer(modifier = Modifier.weight(1f))
        Text(
            "${svc.count} uzman",
            fontSize = 11.sp,
            fontWeight = FontWeight.Medium,
            color = AppColors.InkTertiary,
        )
    }
}

@Composable
private fun HomeSection(
    title: String,
    icon: ImageVector,
    tint: Color,
    content: @Composable () -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.fillMaxWidth()) {
        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(7.dp)) {
            Icon(icon, contentDescription = null, tint = tint, modifier = Modifier.size(17.dp))
            Text(title, fontSize = 18.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
        }
        content()
    }
}
