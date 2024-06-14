package com.facit;

public class WidgetItem {
    int _id;

    String content;

    Boolean success;

    long itemId;

    public WidgetItem(int _id, String content, Boolean success, long itemId) {
        this._id = _id;
        this.content = content;
        this.success = success;
        this.itemId = itemId;
    }

    public int get_id() {
        return _id;
    }

    public void set_id(int _id) {
        this._id = _id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }
}