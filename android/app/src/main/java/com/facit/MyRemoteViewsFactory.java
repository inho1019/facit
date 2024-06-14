package com.facit;

import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.text.SpannableString;
import android.text.style.StrikethroughSpan;
import android.util.TypedValue;
import android.widget.ListView;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;

import java.util.ArrayList;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * 런처 앱에 리스트뷰의 어뎁터 역할을 해주는 클래스
 */
public class MyRemoteViewsFactory implements RemoteViewsService.RemoteViewsFactory {

    private Context context;
    private ArrayList<WidgetItem> arrayList;

    public MyRemoteViewsFactory(Context context) {
        this.context = context;
        this.arrayList = new ArrayList<>();
    }

    // DB를 대신하여 arrayList에 데이터를 추가하는 함수
    private void setData() throws JSONException {
        SharedPreferences sharedPref = context.getSharedPreferences("DATA", Context.MODE_PRIVATE);
        String appString = sharedPref.getString("appData", "{\"data\":[]}");
        JSONObject appData = new JSONObject(appString);
        JSONArray jsonArray = appData.getJSONArray("data");
        arrayList.clear(); // 기존 데이터를 초기화
        for (int i = 0; i < jsonArray.length(); i++) {
            arrayList.add(new WidgetItem(i, jsonArray.getJSONObject(i).getString("content"), jsonArray.getJSONObject(i).getBoolean("success"), jsonArray.getJSONObject(i).getLong("id")));
        }
    }

    // 실행 최초로 호출되는 함수
    @Override
    public void onCreate() {
        // 초기 데이터 로드
        try {
            setData();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    @Override
    public void onDataSetChanged() {
        // 데이터가 변경될 때 다시 로드
        try {
            setData();
        } catch (JSONException e) {
            e.printStackTrace();
        }
    }

    // 마지막에 호출되는 함수
    @Override
    public void onDestroy() {
        // Clean up resources
        arrayList.clear();
    }

    // 항목 개수를 반환하는 함수
    @Override
    public int getCount() {
        return arrayList.size();
    }

    // 각 항목을 구현하기 위해 호출, 매개변수 값을 참조하여 각 항목을 구성하기 위한 로직이 담긴다.
    // 항목 선택 이벤트 발생 시 인텐트에 담겨야 할 항목 데이터를 추가해주어야 하는 함수
    @Override
    public RemoteViews getViewAt(int position) {
        if (position < 0 || position >= arrayList.size()) {
            return null;
        }

        RemoteViews listViewWidget = new RemoteViews(context.getPackageName(), R.layout.item_collection);
        if(arrayList.get(position).success) {
            String content = "\u2611\u00A0\u00A0" + arrayList.get(position).content;
            SpannableString spannableString = new SpannableString(content);
            spannableString.setSpan(new StrikethroughSpan(), 0, content.length(), 0);
            listViewWidget.setTextViewText(R.id.text1, spannableString);
        } else {
            listViewWidget.setTextViewText(R.id.text1, "\u2610\u00A0\u00A0" + arrayList.get(position).content);
        }

        Intent fillInIntent = new Intent();
        fillInIntent.putExtra("item_id", arrayList.get(position).itemId);
        listViewWidget.setOnClickFillInIntent(R.id.text1, fillInIntent);

        return listViewWidget;
    }

    // 로딩 뷰를 표현하기 위해 호출, 없으면 null
    @Override
    public RemoteViews getLoadingView() {
        return null;
    }

    // 항목의 타입 갯수를 판단하기 위해 호출, 모든 항목이 같은 뷰 타입이라면 1을 반환하면 된다.
    @Override
    public int getViewTypeCount() {
        return 1;
    }

    // 각 항목의 식별자 값을 얻기 위해 호출
    @Override
    public long getItemId(int position) {
        return position;
    }

    // 같은 ID가 항상 같은 개체를 참조하면 true 반환하는 함수
    @Override
    public boolean hasStableIds() {
        return true;
    }
}
