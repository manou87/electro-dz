package dz.electro.simuplc;

import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.ViewParent;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.splashscreen.SplashScreen;
import com.getcapacitor.BridgeActivity;

/**
 * Hardens Capacitor WebView for Simu PLC Pro touch interaction on Android.
 * Root cause addressed: Theme.SplashScreen without installSplashScreen/postSplashScreenTheme
 * can leave a native splash layer that shows the logo and swallows all touches.
 */
public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Required when launch theme parents Theme.SplashScreen (Android 12+).
        SplashScreen splashScreen = SplashScreen.installSplashScreen(this);
        splashScreen.setKeepOnScreenCondition(() -> false);

        super.onCreate(savedInstanceState);

        getWindow().addFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED);
        // After bridge/WebView inflation, force focus + touch delivery.
        final View decor = getWindow().getDecorView();
        decor.post(this::hardenWebView);
        decor.postDelayed(this::hardenWebView, 250);
        decor.postDelayed(this::hardenWebView, 1000);
    }

    private void hardenWebView() {
        if (this.bridge == null) {
            return;
        }
        WebView webView = this.bridge.getWebView();
        if (webView == null) {
            return;
        }

        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocus(View.FOCUS_DOWN);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
        webView.setNestedScrollingEnabled(false);
        webView.setHorizontalScrollBarEnabled(false);
        webView.setVerticalScrollBarEnabled(false);
        webView.setClickable(true);
        webView.setLongClickable(false);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        try {
            settings.setOffscreenPreRaster(true);
        } catch (Throwable ignored) {
        }

        // Prevent parent layouts from intercepting drag/pan gestures.
        ViewParent parent = webView.getParent();
        if (parent instanceof View) {
            ((View) parent).setClickable(false);
        }
        if (parent instanceof ViewGroup) {
            ((ViewGroup) parent).setMotionEventSplittingEnabled(false);
        }
        if (parent != null) {
            parent.requestDisallowInterceptTouchEvent(true);
        }
        webView.setOnTouchListener((v, event) -> {
            ViewParent p = v.getParent();
            if (p != null) {
                p.requestDisallowInterceptTouchEvent(true);
            }
            return false; // let WebView handle the event
        });
    }
}
