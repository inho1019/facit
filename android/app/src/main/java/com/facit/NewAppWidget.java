package com.facit;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.widget.ListView;
import android.widget.RemoteViews;
import android.content.SharedPreferences;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;

/**
 * Implementation of App Widget functionality.
 */
public class NewAppWidget extends AppWidgetProvider {


    static void updateAppWidget(Context context, AppWidgetManager appWidgetManager,
                               int appWidgetId) {
        try {
            SharedPreferences sharedPref = context.getSharedPreferences("DATA", Context.MODE_PRIVATE);
            String appString = sharedPref.getString("appData", "{\"text\":\"no data\"}");
            JSONObject appData = new JSONObject(appString);

            // 데이터가 변경됨을 감지하고 MyRemoteViewsFactory 클래스의 onDataSetChanged() 메서드를 호출하여 데이터를 업데이트합니다.
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            manager.notifyAppWidgetViewDataChanged(appWidgetId, R.id.listView);

            // RemoteViews 객체 생성
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.new_app_widget);
            views.setTextViewText(R.id.textView, appData.getString("date"));

            // RemoteViews에 리스트뷰의 어댑터 설정
            Intent serviceIntent = new Intent(context, MyRemoteViewsService.class);
            views.setRemoteAdapter(R.id.listView, serviceIntent);

            Intent intent = new Intent(context, MainActivity.class); // 여기서 MainActivity는 앱에서 열고자 하는 액티비티입니다.
            PendingIntent pendingIntent = PendingIntent.getActivity(context, 1, intent, PendingIntent.FLAG_IMMUTABLE);
            views.setOnClickPendingIntent(R.id.widgetContainer, pendingIntent);
            views.setPendingIntentTemplate(R.id.listView, pendingIntent);

            // App Widget 업데이트
            appWidgetManager.updateAppWidget(appWidgetId, views);
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId);
        }
    }
    @Override
    public void onEnabled(Context context) {
        // Enter relevant functionality for when the first widget is created
    }

    @Override
    public void onDisabled(Context context) {
        // Enter relevant functionality for when the last widget is disabled
    }
}