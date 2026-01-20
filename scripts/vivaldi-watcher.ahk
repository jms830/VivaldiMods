; ============================================================================
; Vivaldi Mods Auto-Patcher - AutoHotkey v2 File Watcher
; ============================================================================
; This script monitors the Vivaldi Application folder for new version folders.
; When Vivaldi updates (creates a new version folder), it automatically
; runs the JS mods installer to re-apply your customizations.
;
; SETUP:
;   1. Install AutoHotkey v2 from https://www.autohotkey.com/
;   2. Edit the paths below to match your setup
;   3. Run this script (double-click or add to startup)
;
; To add to Windows startup:
;   - Press Win+R, type: shell:startup
;   - Create a shortcut to this .ahk file in that folder
; ============================================================================

#Requires AutoHotkey v2.0
#SingleInstance Force

; --- Configuration ---
; Path to Vivaldi's Application folder (where version folders are created)
vivaldiPath := A_AppData . "\..\Local\Vivaldi\Application"

; Path to the JS mods installer script
; Auto-detect: if this script is in the repo's scripts/ folder, use that
; Otherwise, set this manually to your revivarc-vivaldi repo location
installerScript := ""

; Try to auto-detect installer path
if FileExist(A_ScriptDir "\install-js-mods.bat") {
    ; We're running from the repo's scripts/ folder
    installerScript := A_ScriptDir "\install-js-mods.bat"
} else if FileExist(A_ScriptDir "\..\revivarc-vivaldi\scripts\install-js-mods.bat") {
    ; We're in a sibling AutoHotkey folder, repo is nearby
    installerScript := A_ScriptDir "\..\revivarc-vivaldi\scripts\install-js-mods.bat"
} else {
    ; Fallback: check common locations
    for _, path in [
        A_MyDocuments "\github\revivarc-vivaldi\scripts\install-js-mods.bat",
        A_MyDocuments "\..\github\revivarc-vivaldi\scripts\install-js-mods.bat",
        "C:\Users\" A_UserName "\github\revivarc-vivaldi\scripts\install-js-mods.bat"
    ] {
        if FileExist(path) {
            installerScript := path
            break
        }
    }
}

; If still not found, check if path was set via config file
configFile := A_ScriptDir "\vivaldi-watcher.ini"
if FileExist(configFile) {
    installerScript := IniRead(configFile, "Settings", "InstallerScript", installerScript)
}

; Cooldown in milliseconds (don't run installer more than once per 30 seconds)
cooldownMs := 30000

; --- Validate paths ---
if !DirExist(vivaldiPath) {
    MsgBox("Error: Vivaldi Application folder not found.`n`n" vivaldiPath "`n`nPlease check your Vivaldi installation.", "Vivaldi Watcher Error")
    ExitApp
}

if !FileExist(installerScript) {
    ; Offer to let user browse for it
    result := MsgBox("JS mods installer script not found.`n`nWould you like to browse for install-js-mods.bat?", "Vivaldi Watcher", "YesNo")
    if result = "Yes" {
        selectedFile := FileSelect(1, A_MyDocuments, "Select install-js-mods.bat", "Batch Files (*.bat)")
        if selectedFile {
            installerScript := selectedFile
            ; Save to config for next time
            IniWrite(installerScript, configFile, "Settings", "InstallerScript")
        } else {
            ExitApp
        }
    } else {
        ExitApp
    }
}

; --- State ---
isReady := true
lastKnownVersion := GetLatestVivaldiVersion()

; --- Start monitoring ---
; Watch for directory changes (new version folders)
SetTimer(CheckForNewVersion, 10000)  ; Check every 10 seconds

; Show tray tip on startup
TrayTip("Vivaldi Watcher Active", "Monitoring for Vivaldi updates...`nCurrent version: " lastKnownVersion, 1)

; Keep script running
Persistent

; --- Functions ---

GetLatestVivaldiVersion() {
    global vivaldiPath
    latestVersion := ""
    
    Loop Files vivaldiPath "\*", "D" {
        ; Check if folder name looks like a version number (starts with digit)
        if RegExMatch(A_LoopFileName, "^\d+\.\d+") {
            ; Check if it has window.html (is a valid Vivaldi version folder)
            if FileExist(A_LoopFilePath "\resources\vivaldi\window.html") {
                latestVersion := A_LoopFileName
            }
        }
    }
    
    return latestVersion
}

CheckForNewVersion() {
    global vivaldiPath, installerScript, isReady, lastKnownVersion, cooldownMs
    
    currentVersion := GetLatestVivaldiVersion()
    
    ; Check if version changed and we're ready to run
    if (currentVersion != lastKnownVersion && currentVersion != "" && isReady) {
        ; Check if the new version is already patched
        versionPath := vivaldiPath "\" currentVersion "\resources\vivaldi"
        if FileExist(versionPath "\custom.js") {
            ; Already patched, just update our tracked version
            lastKnownVersion := currentVersion
            return
        }
        
        ; New unpatched version detected!
        isReady := false
        lastKnownVersion := currentVersion
        
        TrayTip("Vivaldi Updated!", "New version detected: " currentVersion "`nApplying JS mods...", 1)
        
        ; Run the installer
        RunWait(installerScript)
        
        TrayTip("JS Mods Applied", "Vivaldi " currentVersion " has been patched.`nPlease restart Vivaldi.", 1)
        
        ; Set cooldown timer
        SetTimer(() => isReady := true, -cooldownMs)
    }
}

; --- Tray Menu ---
A_TrayMenu.Delete()  ; Remove default menu items
A_TrayMenu.Add("Check Now", (*) => CheckForNewVersion())
A_TrayMenu.Add("Run Installer", (*) => Run(installerScript))
A_TrayMenu.Add()
A_TrayMenu.Add("Open Vivaldi Folder", (*) => Run(vivaldiPath))
A_TrayMenu.Add("Open Scripts Folder", (*) => Run(StrReplace(installerScript, "\install-js-mods.bat", "")))
A_TrayMenu.Add()
A_TrayMenu.Add("Exit", (*) => ExitApp())
