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
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.ChatBubble
import androidx.compose.material.icons.filled.LocationOn
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.ExperimentalMaterial3Api
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
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.compose.viewModel
import com.rork.asistanrezervasyonandroid.data.ApiService
import com.rork.asistanrezervasyonandroid.data.Provider
import com.rork.asistanrezervasyonandroid.data.SearchFilters
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.EmptyStateView
import com.rork.asistanrezervasyonandroid.ui.components.FilterChipPill
import com.rork.asistanrezervasyonandroid.ui.components.ProviderCard
import com.rork.asistanrezervasyonandroid.ui.components.SkeletonCard
import com.rork.asistanrezervasyonandroid.ui.components.pressableClickable
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SearchViewModel : ViewModel() {
    val query = MutableStateFlow("")

    private val _providers = MutableStateFlow<List<Provider>>(emptyList())
    val providers: StateFlow<List<Provider>> = _providers.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _sort = MutableStateFlow("nearest")
    val sort: StateFlow<String> = _sort.asStateFlow()

    private val _filters = MutableStateFlow(SearchFilters())
    val filters: StateFlow<SearchFilters> = _filters.asStateFlow()

    var hasSearched = false
        private set

    private var searchJob: Job? = null

    fun setSort(value: String, lat: Double?, lng: Double?) {
        _sort.value = value
        search(lat, lng, debounce = false)
    }

    fun setFilters(value: SearchFilters, lat: Double?, lng: Double?) {
        _filters.value = value
        search(lat, lng, debounce = false)
    }

    fun setQuery(value: String, lat: Double?, lng: Double?) {
        query.value = value
        search(lat, lng, debounce = true)
    }

    fun search(lat: Double?, lng: Double?, debounce: Boolean = true) {
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            if (debounce) delay(350)
            _isLoading.value = true
            hasSearched = true
            _providers.value = try {
                ApiService.search(
                    lat = lat,
                    lng = lng,
                    query = query.value.trim().ifEmpty { null },
                    filters = _filters.value,
                    sort = _sort.value,
                )
            } catch (_: Exception) {
                emptyList()
            }
            _isLoading.value = false
        }
    }
}

private val sortOptions = listOf(
    Triple("nearest", "En yakın", Icons.Filled.LocationOn),
    Triple("earliest", "En erken", Icons.Filled.Bolt),
    Triple("rating", "En yüksek puan", Icons.Filled.Star),
    Triple("reviews", "En çok yorum", Icons.Filled.ChatBubble),
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    auth: AuthViewModel,
    onOpenDoctor: (String) -> Unit,
    modifier: Modifier = Modifier,
) {
    val model: SearchViewModel = viewModel()
    val query by model.query.collectAsStateWithLifecycle()
    val providers by model.providers.collectAsStateWithLifecycle()
    val isLoading by model.isLoading.collectAsStateWithLifecycle()
    val sort by model.sort.collectAsStateWithLifecycle()
    val filters by model.filters.collectAsStateWithLifecycle()
    var showFilters by remember { mutableStateOf(false) }

    val coord = auth.coordinate
    val lat = coord?.first
    val lng = coord?.second

    LaunchedEffect(Unit) {
        if (!model.hasSearched) model.search(lat, lng, debounce = false)
    }

    Column(modifier = modifier.fillMaxSize().statusBarsPadding()) {
        // Header
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 18.dp)
                .padding(top = 8.dp, bottom = 12.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text("Ara", fontSize = 28.sp, fontWeight = FontWeight.Black, color = AppColors.Ink)
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = query,
                    onValueChange = { model.setQuery(it, lat, lng) },
                    placeholder = { Text("Doktor, klinik veya hizmet", fontSize = 15.sp, color = AppColors.InkTertiary) },
                    leadingIcon = {
                        Icon(Icons.Filled.Search, contentDescription = null, tint = AppColors.InkTertiary, modifier = Modifier.size(20.dp))
                    },
                    trailingIcon = {
                        if (query.isNotEmpty()) {
                            IconButton(onClick = { model.setQuery("", lat, lng) }) {
                                Icon(Icons.Filled.Cancel, contentDescription = "Temizle", tint = AppColors.InkTertiary, modifier = Modifier.size(20.dp))
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(14.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = AppColors.Teal,
                        unfocusedBorderColor = AppColors.Stroke,
                        focusedContainerColor = AppColors.Surface,
                        unfocusedContainerColor = AppColors.Surface,
                    ),
                    modifier = Modifier.weight(1f),
                )

                // Filter button with badge
                Box {
                    val active = filters.activeCount > 0
                    Box(
                        modifier = Modifier
                            .size(56.dp)
                            .clip(RoundedCornerShape(14.dp))
                            .then(
                                if (active) Modifier.background(AppColors.BrandGradient)
                                else Modifier
                                    .background(AppColors.Surface)
                                    .border(1.dp, AppColors.Stroke, RoundedCornerShape(14.dp))
                            )
                            .pressableClickable { showFilters = true },
                        contentAlignment = Alignment.Center,
                    ) {
                        Icon(
                            Icons.Filled.Tune,
                            contentDescription = "Filtrele",
                            tint = if (active) Color.White else AppColors.Ink,
                            modifier = Modifier.size(22.dp),
                        )
                    }
                    if (active) {
                        Box(
                            modifier = Modifier
                                .align(Alignment.TopEnd)
                                .offset(x = 5.dp, y = (-5).dp)
                                .size(16.dp)
                                .background(Color.White, CircleShape),
                            contentAlignment = Alignment.Center,
                        ) {
                            Text(
                                "${filters.activeCount}",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = AppColors.Teal,
                            )
                        }
                    }
                }
            }
        }

        // Sort bar
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 18.dp)
                .padding(bottom = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            sortOptions.forEach { (key, label, icon) ->
                FilterChipPill(
                    title = label,
                    isSelected = sort == key,
                    icon = icon,
                ) { model.setSort(key, lat, lng) }
            }
        }

        // Results
        if (isLoading) {
            Column(
                modifier = Modifier.padding(horizontal = 18.dp),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                repeat(4) { SkeletonCard(height = 150.dp) }
            }
        } else if (providers.isEmpty()) {
            EmptyStateView(
                icon = Icons.Filled.Search,
                title = "Sonuç bulunamadı",
                message = "Arama veya filtrelerinizi değiştirerek tekrar deneyin.",
                modifier = Modifier.padding(top = 40.dp),
            )
        } else {
            LazyColumn(
                contentPadding = androidx.compose.foundation.layout.PaddingValues(
                    start = 18.dp, end = 18.dp, top = 4.dp, bottom = 110.dp
                ),
                verticalArrangement = Arrangement.spacedBy(14.dp),
            ) {
                items(providers, key = { it.staffId }) { provider ->
                    Box(modifier = Modifier.pressableClickable { onOpenDoctor(provider.staffId) }) {
                        ProviderCard(provider = provider)
                    }
                }
            }
        }
        Spacer(modifier = Modifier.weight(1f))
    }

    if (showFilters) {
        FilterSheet(
            initial = filters,
            onDismiss = { showFilters = false },
            onApply = { newFilters ->
                model.setFilters(newFilters, lat, lng)
                showFilters = false
            },
        )
    }
}
