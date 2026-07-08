package com.rork.asistanrezervasyonandroid.ui.navigation

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.zIndex
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.rork.asistanrezervasyonandroid.ui.AuthPhase
import com.rork.asistanrezervasyonandroid.ui.AuthViewModel
import com.rork.asistanrezervasyonandroid.ui.components.LocalToast
import com.rork.asistanrezervasyonandroid.ui.components.ToastOverlay
import com.rork.asistanrezervasyonandroid.ui.components.ToastState
import com.rork.asistanrezervasyonandroid.ui.screens.AuthScreen
import com.rork.asistanrezervasyonandroid.ui.screens.BookingFlowScreen
import com.rork.asistanrezervasyonandroid.ui.screens.ClinicProfileScreen
import com.rork.asistanrezervasyonandroid.ui.screens.DoctorProfileScreen
import com.rork.asistanrezervasyonandroid.ui.screens.LocationOnboardingScreen
import com.rork.asistanrezervasyonandroid.ui.screens.MainTabScreen
import com.rork.asistanrezervasyonandroid.ui.screens.SplashScreen
import com.rork.asistanrezervasyonandroid.ui.theme.AppColors

@Composable
fun AppNavigation() {
    val auth: AuthViewModel = viewModel()
    val phase by auth.phase.collectAsStateWithLifecycle()
    val scope = rememberCoroutineScope()
    val toast = remember { ToastState(scope) }

    LaunchedEffect(Unit) { auth.bootstrap() }

    CompositionLocalProvider(LocalToast provides toast) {
        Box(modifier = Modifier.fillMaxSize().background(AppColors.Canvas)) {
            AnimatedContent(
                targetState = phase,
                transitionSpec = { fadeIn() togetherWith fadeOut() },
                label = "authPhase",
            ) { currentPhase ->
                when (currentPhase) {
                    AuthPhase.LOADING -> SplashScreen()
                    AuthPhase.UNAUTHENTICATED -> AuthScreen(auth = auth)
                    AuthPhase.ONBOARDING_LOCATION -> LocationOnboardingScreen(auth = auth)
                    AuthPhase.READY -> ReadyNavHost(auth = auth)
                }
            }

            ToastOverlay(
                state = toast,
                modifier = Modifier.align(Alignment.TopCenter).zIndex(10f),
            )
        }
    }
}

@Composable
private fun ReadyNavHost(auth: AuthViewModel) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "main") {
        composable("main") {
            MainTabScreen(
                auth = auth,
                onOpenDoctor = { staffId -> navController.navigate("doctor/$staffId") },
                onOpenClinic = { businessId -> navController.navigate("clinic/$businessId") },
            )
        }
        composable(
            route = "doctor/{staffId}",
            arguments = listOf(navArgument("staffId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val staffId = backStackEntry.arguments?.getString("staffId") ?: return@composable
            DoctorProfileScreen(
                staffId = staffId,
                auth = auth,
                onBack = { navController.popBackStack() },
                onOpenClinic = { businessId -> navController.navigate("clinic/$businessId") },
                onBook = { id -> navController.navigate("booking/$id") },
            )
        }
        composable(
            route = "clinic/{businessId}",
            arguments = listOf(navArgument("businessId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val businessId = backStackEntry.arguments?.getString("businessId") ?: return@composable
            ClinicProfileScreen(
                businessId = businessId,
                auth = auth,
                onBack = { navController.popBackStack() },
                onOpenDoctor = { staffId -> navController.navigate("doctor/$staffId") },
            )
        }
        composable(
            route = "booking/{staffId}",
            arguments = listOf(navArgument("staffId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val staffId = backStackEntry.arguments?.getString("staffId") ?: return@composable
            BookingFlowScreen(
                staffId = staffId,
                auth = auth,
                onClose = { navController.popBackStack() },
                onDone = {
                    // Back to main; the user opens Randevularım from the tab bar.
                    navController.popBackStack("main", inclusive = false)
                },
            )
        }
    }
}
