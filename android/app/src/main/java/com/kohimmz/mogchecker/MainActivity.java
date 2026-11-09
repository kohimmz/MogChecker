package com.kohimmz.mogchecker;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.webkit.WebView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int CAMERA_PERMISSION_CODE = 1001;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure runtime Camera permission is requested from user
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.CAMERA}, CAMERA_PERMISSION_CODE);
        }

        // Configure WebView for smooth WebRTC front camera streaming
        try {
            WebView webView = getBridge().getWebView();
            webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
