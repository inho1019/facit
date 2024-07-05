else if (new Date(dateData?.timestamp).getDay() === 0) {
    styles.push({color: 'tomato'});
}
else if (new Date(dateData?.timestamp).getDay() === 6) {
    styles.push({color: '#2E8DFF'});
}
//day의 period, base 폴더의 index.js의 today 항목위에 추가