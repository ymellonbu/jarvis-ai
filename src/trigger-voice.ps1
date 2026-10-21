# Trigger Windows 11 Native Voice Typing (Win + H)
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public class KeySender {
    [DllImport("user32.dll")]
    public static extern void keybd_event(byte bVk, byte bScan, uint dwFlags, UIntPtr dwExtraInfo);

    public static void TriggerWinH() {
        // 0x5B = VK_LWIN, 0x48 = 'H'
        keybd_event(0x5B, 0, 0, UIntPtr.Zero);
        keybd_event(0x48, 0, 0, UIntPtr.Zero);
        keybd_event(0x48, 0, 2, UIntPtr.Zero);
        keybd_event(0x5B, 0, 2, UIntPtr.Zero);
    }
}
"@ -ErrorAction SilentlyContinue

[KeySender]::TriggerWinH()
