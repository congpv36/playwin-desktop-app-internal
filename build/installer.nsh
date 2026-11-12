!define APP_NAME "PlayWin-Internal"

!define DEFAULT_INSTALL_PATH "C:\${APP_NAME}"
!define INSTALL_REGISTRY_KEY "Software\${APP_NAME}"

!macro WriteInstallLocation
  WriteRegExpandStr HKLM "${INSTALL_REGISTRY_KEY}" InstallLocation "${DEFAULT_INSTALL_PATH}"
  WriteRegExpandStr HKCU "${INSTALL_REGISTRY_KEY}" InstallLocation "${DEFAULT_INSTALL_PATH}"
!macroend

!macro preInit
  ; Suggest previous installation path if it exists
  ReadRegStr $R0 HKLM "${INSTALL_REGISTRY_KEY}" "InstallLocation"
  IfErrors 0 +2
  StrCpy $R0 "${DEFAULT_INSTALL_PATH}"
  StrCpy $INSTDIR $R0

  SetRegView 64
  !insertmacro WriteInstallLocation
  SetRegView 32
  !insertmacro WriteInstallLocation
!macroend

!macro customInstall
  CreateDirectory "$SMPROGRAMS\${SHORTCUT_NAME}"
  CreateShortCut "$DESKTOP\${SHORTCUT_NAME}.lnk" "$INSTDIR\${SHORTCUT_NAME}.exe"
  CreateShortCut "$SMPROGRAMS\${SHORTCUT_NAME}\${SHORTCUT_NAME}.lnk" "$INSTDIR\${SHORTCUT_NAME}.exe"

  ; Xóa thư mục -data
  ReadEnvStr $R3 "USERPROFILE"
  RMDir /r "$R3\AppData\Roaming\${APP_NAME}-data"

  WriteUninstaller "$INSTDIR\uninstall.exe"
!macroend


!macro customUninstall
  nsExec::Exec 'taskkill /F /IM "${APP_NAME}.exe"'
  Sleep 2000

  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk"
  RMDir "$SMPROGRAMS\${APP_NAME}"
  ReadEnvStr $R4 "USERNAME"
  RMDir /r "C:\Users\$R4\AppData\Local\${APP_NAME}-updater"

  SetRegView 64
  DeleteRegKey HKLM "${INSTALL_REGISTRY_KEY}"
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
  SetRegView 32
  DeleteRegKey HKCU "${INSTALL_REGISTRY_KEY}"
  DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

  SetOutPath "$TEMP"
  StrCpy $R0 "$INSTDIR"
  StrCpy $R1 "$TEMP\del_${APP_NAME}.bat"
  FileOpen $R2 $R1 w
  FileWrite $R2 "@echo off$\n"
  FileWrite $R2 "ping 127.0.0.1 -n 5 > nul$\n"
  FileWrite $R2 'takeown /F "$R0" /R /D Y$\n'
  FileWrite $R2 'icacls "$R0" /grant administrators:F /T$\n'
  FileWrite $R2 'rmdir /s /q "$R0"$\n'
  FileWrite $R2 'if exist "$R0" goto retry$\n'
  FileWrite $R2 "del %0$\n"
  FileClose $R2
  ExecShell "open" "$R1" "" SW_HIDE
!macroend

Section "Uninstall"
  !insertmacro customUninstall
SectionEnd