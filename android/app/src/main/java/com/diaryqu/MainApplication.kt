package com.diaryqu

import android.app.Application
import com.diaryqu.agenda.AgendaReminderPackage
import com.diaryqu.routines.RoutineProofPickerPackage
import com.diaryqu.tracking.FamilyLocationPackage
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          add(AgendaReminderPackage())
          add(RoutineProofPickerPackage())
          add(FamilyLocationPackage())
        },
    )
  }

  override fun onCreate() {
    super.onCreate()
    loadReactNative(this)
  }
}
