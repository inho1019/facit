import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { AttainType, RoutineDTO, TodoDTO } from "../Index";
import { AnimatedCircularProgress } from 'react-native-circular-progress';

interface Props {
    type: AttainType;
    globalFont: string;
    todoList: TodoDTO[];
    routineList: RoutineDTO[];
    page: number;
    date: Date;
    startDate: Date;
    endDate: Date;
    onDate: (date: Date) => void;
    onStartDate: (date: Date) => void;
    onEndDate: (date: Date) => void;
    onAttainType: (type: AttainType) => void;
}
   

const Attain: React.FC<Props> = ({globalFont,todoList,routineList,page,date,startDate,endDate,type,onDate,onAttainType,onStartDate,onEndDate}) => {

    const nowDate = useMemo(() => new Date(),[page]);

    const scrollRef = useRef<ScrollView>(null)

    const circleRef1 = useRef<AnimatedCircularProgress>(null);
    const circleRef2 = useRef<AnimatedCircularProgress>(null);

    const aniTot = useRef(new Animated.Value(0)).current
    const aniTxt = useRef(new Animated.Value(0)).current

    const dateToInt = (date : Date | string) => {
        const newDate = new Date(date)
        const numDate = new Date(newDate.getFullYear(),newDate.getMonth(),newDate.getDate())

        return numDate.getTime();
    }

    const windowWidth = Dimensions.get('window').width;

    const [typeNumber,setTypeNumber] = useState<number>(0); 
    const [typeLoading,setTypeLoading] = useState<boolean>(false);

    const typeChange = (event:any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const typeIndex = Math.round(offsetY / event.nativeEvent.layoutMeasurement.height);
        setTypeNumber(typeIndex);
    }

    const todoFillList: TodoDTO[] = useMemo(() => {
        if( type === "date" ) {
            return todoList.filter(todo => dateToInt(todo.date) === dateToInt(date))
        } else {
            return todoList.filter(todo => dateToInt(todo.date) >= dateToInt(startDate) && dateToInt(todo.date) <= dateToInt(endDate))
        }
    },[todoList,page,date,type,startDate,endDate])

    const routineFillList: RoutineDTO[] = useMemo(() => {
        if( type === "date" ) {
            return routineList.filter(rou => !(rou.end && dateToInt(rou.startDate) === dateToInt(endDate)) && dateToInt(rou.startDate) <= dateToInt(date) && 
                (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])
        } else {
            const indexArr:number[] = [0,1,2,3,4,5,6]
            let checkArr:number[] = []
            const dateGap = (dateToInt(endDate) - dateToInt(startDate)) / 86400000
            if (dateGap < 7) {
                if (new Date(startDate).getDay() <= new Date(endDate).getDay()) {
                    checkArr = indexArr.map((item) => item >= new Date(startDate).getDay() && item <= new Date(endDate).getDay() ? item : -1) 
                } else {
                    checkArr = indexArr.map((item) => item >= new Date(startDate).getDay() || item <= new Date(endDate).getDay() ? item : -1)
                }
            }
            return routineList.filter(rou => !(rou.end && dateToInt(rou.startDate) === dateToInt(endDate)) && 
                dateToInt(rou.startDate) <= dateToInt(endDate) && 
                (rou.end ? dateToInt(rou.endDate) > dateToInt(startDate) : true) && 
                (dateGap < 7 ? checkArr.some(item => rou.term[item]) : true ))
        }
    },[routineList,page,date,type,startDate,endDate])
          
    
    const todoFill = useMemo(() => 
        todoFillList.filter(todo => todo.success).length / todoFillList.length * 100
    ,[todoFillList,page,date]);
    
    const routineFill = useMemo(() => 
        routineFillList.filter(rou => rou.success.findIndex(item => type === "date" ? (dateToInt(item) === dateToInt(date)) : 
        (dateToInt(item) >= dateToInt(startDate) && dateToInt(item) <= dateToInt(endDate))) !== -1).length / routineFillList.length * 100
    ,[routineFillList,page,date]);

    const totalFill = useMemo(() => {
        if (todoFillList.length + routineFillList.length === 0) {
            return 0;
        }
        return (todoFillList.filter(todo => todo.success).length + routineFillList.filter(rou => rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).length) /
        (todoFillList.length + routineFillList.length) * 100
    },[todoFillList,routineFillList]);

    useEffect(() => {
        if (page === 1) {
            aniTxt.setValue(0);
            onAttainType(
                typeNumber === 0 ? "date" :
                typeNumber === 1 ? "week" :
                typeNumber === 2 ? "month" :
                typeNumber === 3 ? "year" :
                "custom"
            )
            if ( typeNumber === 1) {
                const setStartDate = new Date()
                setStartDate.setDate(setStartDate.getDate()-( nowDate.getDay() === 0 ? 7 : nowDate.getDay() )+1)
                onStartDate(setStartDate)
                onEndDate(nowDate)
            }
        }
    },[typeNumber])

    useEffect(() => {
        if(page === 0) {
            if(type === "date") {
                setTypeNumber(0)
                scrollRef.current?.scrollTo({y: 0 ,animated:false})
            }
            if(type === "week") {
                setTypeNumber(1)
                scrollRef.current?.scrollTo({y: 45,animated:false})
            }
            if(type === "month") {
                setTypeNumber(2)
                scrollRef.current?.scrollTo({y: 90,animated:false})
            }
            if(type === "year") {
                setTypeNumber(3)
                scrollRef.current?.scrollTo({y: 135,animated:false})
            }
            if(type === "custom") {
                setTypeNumber(4)
                scrollRef.current?.scrollTo({y: 180,animated:false})
            }
        }
    },[type,page])

    useEffect(() => {
        if ( page === 1 ) {
            if (circleRef1.current) {
                circleRef1.current.animate(todoFill, 1200, Easing.inOut(Easing.quad));
            }
            if (circleRef2.current) {
                circleRef2.current.animate(routineFill, 1200, Easing.inOut(Easing.quad));
            }
            Animated.timing(aniTot, {
                toValue: totalFill * ((windowWidth - 90) / 100),
                duration: 1000,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start(() => {
                Animated.timing(aniTxt, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.ease)
                }).start();
            })
        } else {
            if (circleRef1.current) {
                circleRef1.current.animate(0,1,Easing.quad)
            }
            if (circleRef2.current) {
                circleRef2.current.animate(0,1,Easing.quad)
            }
            aniTot.setValue(0);
            aniTxt.setValue(0);
        }
    },[page,date,todoFillList,routineFillList])

    return(
        <ScrollView style={{flex:1}}>
            <View style={{flexDirection:'row', alignItems:'center', justifyContent:'center',marginTop:5}}>
                <View style={{marginTop:2}}>
                    <Pressable
                        disabled={typeNumber === 0 || typeLoading}
                        onPress={() => {
                            setTypeLoading(true)
                            setTypeNumber(item => item - 1)
                            scrollRef.current?.scrollTo({y: (typeNumber - 1) * 45,animated:true})
                            setTimeout(() => setTypeLoading(false),400)
                        }}
                    >
                        <Image source={require(  '../../assets/image/triangle.png')} 
                            style={{width:15,height:15,opacity: typeNumber === 0 ? 0.3 : 1}}/>
                    </Pressable>
                    <Pressable
                        disabled={typeNumber === 4 || typeLoading}
                        onPress={() => {
                            setTypeLoading(true)
                            setTypeNumber(item => item + 1)
                            scrollRef.current?.scrollTo({y: (typeNumber + 1) * 45,animated:true})
                            setTimeout(() => setTypeLoading(false),400)
                        }}
                    >
                        <Image source={require(  '../../assets/image/triangle.png')} 
                            style={{width:15,height:15,opacity: typeNumber === 4 ? 0.3 : 1, transform:[{rotate : '180deg'}]}}/>
                    </Pressable>
                </View>
                <View style={{width:60,height:45}}>
                    <ScrollView
                            ref={ scrollRef }
                            pagingEnabled
                            keyboardShouldPersistTaps='handled'
                            showsVerticalScrollIndicator={false}
                            onMomentumScrollEnd={typeChange}
                            contentContainerStyle={{height: 225}}
                            scrollEventThrottle={50}
                            decelerationRate="fast"
                        >
                            <Text style={[styles.topTitle,{color:globalFont}]}>일간</Text>        
                            <Text style={[styles.topTitle,{color:globalFont}]}>주간</Text>        
                            <Text style={[styles.topTitle,{color:globalFont}]}>월간</Text>        
                            <Text style={[styles.topTitle,{color:globalFont}]}>연간</Text>
                            <Text style={[styles.topTitle,{color:globalFont}]}>선택</Text>        
                    </ScrollView>
                </View>
            </View>
            <View style={styles.attainBox}>
                { type === "date" ? 
                // 일간
                <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                    <Pressable
                        onPress={() => {
                            onDate(new Date(date.getTime() - 86400000))
                            aniTxt.setValue(0);
                        }}
                    >
                        <Image source={require(  '../../assets/image/arrow.png')} 
                            style={{width:25,height:25, marginTop: 15, transform:[{rotate : '-90deg'}]}}/>
                    </Pressable>
                    <Pressable
                        disabled={dateToInt(date) === dateToInt(new Date())}
                        onPress={() => onDate(new Date())}
                    >
                        <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                            {   dateToInt(date) === dateToInt(new Date()) ? '오늘' :
                                dateToInt(date) === (dateToInt(new Date())) - 86400000 ? '어제' :
                                `${date.getMonth()+1}월 ${date.getDate()}일 ${date.getDay() === 0 ? '일' : date.getDay() === 1 ? '월' : 
                                date.getDay() === 2 ? '화' : date.getDay() === 3 ? '수' : date.getDay() === 4 ? '목' : date.getDay() === 5 ? '금' : '토'}요일`}
                        </Text>
                    </Pressable>
                    { dateToInt(date) < dateToInt(new Date) ? <Pressable
                        onPress={() => {
                            onDate(new Date(date.getTime() + 86400000))
                            aniTxt.setValue(0);
                        }}
                    >
                        <Image source={require(  '../../assets/image/arrow.png')} 
                            style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                    </Pressable> : <View style={{width:25,height:25}}/>}
                </View> :
                // 주간
                <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                    <Pressable
                        onPress={() => {
                            onStartDate(new Date(startDate.getTime() - 86400000 * 7))
                            onEndDate(new Date(startDate.getTime() - 86400000))
                            aniTxt.setValue(0);
                        }}
                    >
                        <Image source={require(  '../../assets/image/arrow.png')} 
                            style={{width:25,height:25, marginTop: 15, transform:[{rotate : '-90deg'}]}}/>
                    </Pressable>
                    <Pressable
                        disabled={dateToInt(nowDate) - (86400000 * 7) < dateToInt(startDate)}
                        onPress={() => {
                            aniTxt.setValue(0);
                            const setStartDate = new Date()
                            setStartDate.setDate(setStartDate.getDate()-( nowDate.getDay() === 0 ? 7 : nowDate.getDay() )+1)
                            onStartDate(setStartDate)
                            onEndDate(nowDate)
                        }}
                    >
                        <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                            {   dateToInt(nowDate) - (86400000 * 7) < dateToInt(startDate) ? '이번주' :
                                dateToInt(nowDate) - (86400000 * 14) < dateToInt(startDate)? '저번주' :
                                `${startDate.getMonth()+1}월 ${startDate.getDate()}일 - ${endDate.getMonth()+1}월 ${endDate.getDate()}일`}
                        </Text>
                    </Pressable>
                    { dateToInt(nowDate) - (86400000 * 7) < dateToInt(startDate) ? 
                    <View style={{width:25,height:25}}/>
                    : <Pressable
                        onPress={() => {
                            onStartDate(new Date(startDate.getTime() + 86400000 * 7))
                            onEndDate(dateToInt(new Date(startDate.getTime() + 86400000 * 13)) > dateToInt(nowDate) ? nowDate : new Date(startDate.getTime() + 86400000 * 13))
                            aniTxt.setValue(0);
                        }}
                    >
                        <Image source={require(  '../../assets/image/arrow.png')} 
                            style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                    </Pressable>}
                </View>}
                <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                    <AnimatedCircularProgress
                        ref={circleRef1}
                        size={Math.floor(windowWidth*0.5 - 50)}
                        width={Math.floor(windowWidth*0.5 - 50) * 0.25}
                        rotation={0}
                        lineCap="round"
                        fill={0}
                        tintColor="#2E8DFF"
                        backgroundColor="aliceblue"
                    >
                    {
                        (fill) => 
                            <View style={{alignItems:'center'}}>
                                <Text style={{fontWeight:'bold', color:globalFont}}>목표</Text>
                                <Text style={{fontWeight:'bold', color:globalFont}}>{ todoFillList.length === 0 ? '없음' : Math.floor(fill)+'%' }</Text>
                            </View>
                    }    
                    </AnimatedCircularProgress>
                    <AnimatedCircularProgress
                        ref={circleRef2}
                        size={Math.floor(windowWidth * 0.5 - 50)}
                        width={Math.floor(windowWidth*0.5 - 50) * 0.25}
                        rotation={0}
                        lineCap="round"
                        fill={0}
                        tintColor="tomato"
                        backgroundColor="snow"
                    >
                    {
                        (fill) => 
                            <View style={{alignItems:'center'}}>
                                <Text style={{fontWeight:'bold', color:globalFont}}>루틴</Text>
                                <Text style={{fontWeight:'bold', color:globalFont}}>{ routineFillList.length === 0 ? '없음' : Math.floor(fill)+'%' }</Text>
                            </View>
                    }    
                    </AnimatedCircularProgress>
                </View>
                <View style={{paddingHorizontal:30,marginTop:15}}>
                    <Text style={{fontWeight:'bold', color:globalFont,marginLeft:10,marginBottom:2}}>총 달성률</Text>
                    <View style={{width:'100%',backgroundColor:'whitesmoke',borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.5,overflow:'hidden'}}>
                        <Animated.View style={{
                            height:Math.floor(windowWidth*0.5 - 50) * 0.25,
                            width: aniTot,
                            backgroundColor:'darkgray',
                            borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.5}}>
                                <Animated.Text style={{width:50,fontWeight:'bold', opacity: aniTxt, color:globalFont, position:'absolute', height:Math.floor(windowWidth*0.5 - 50) * 0.25,left: 10,textAlignVertical:'center'}}>{Math.floor(totalFill)}%</Animated.Text>
                        </Animated.View>
                    </View>
                </View>
            </View>
            <View style={[styles.attainBox,{marginBottom:10,gap:10}]}>
                <Text style={[styles.h2,{color:globalFont,marginLeft:15,marginTop:5}]}>달성</Text>
                <View style={{flexDirection:'row',justifyContent:'space-around',marginTop:5}}>
                    <Text style={[styles.h4,{color:globalFont}]}>목표</Text>
                    <Text style={[styles.h4,{color:globalFont}]}>루틴</Text>
                </View>
                <View style={{flexDirection:'row',justifyContent:'center',gap:10,paddingHorizontal:10}}>
                    <ScrollView style={styles.listBox}>
                        {
                            todoFillList.filter(todo => todo.success).map((item,index) => 
                            <Animated.View key={`${item}_${index}`} style={[styles.items,{opacity:aniTxt}]}>
                                <Text style={{color:globalFont}}>{item.content}</Text>
                            </Animated.View>)
                        }
                    </ScrollView>
                    <ScrollView style={styles.listBox}>
                    {
                            routineFillList.filter(rou => rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).map((item,index) => 
                            <Animated.View key={`${item}_${index}`} style={[styles.items,{opacity:aniTxt}]}>
                                <Text style={{color:globalFont}}>{item.content}</Text>
                            </Animated.View>)
                        }
                    </ScrollView>
                </View>
            </View>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    h2 : {
        fontSize: 23,
        fontWeight: 'bold',
    },
    h3 : {
        fontSize: 20,
        fontWeight: 'bold',
    },
    h4 : {
        fontSize: 16,
        fontWeight: 'bold',
    },
    topTitle : {
        width: 60,
        height: 45,
        textAlignVertical:'center',
        textAlign: 'center',
        fontSize: 25,
        fontWeight: 'bold',
    },
    attainBox : {
        paddingHorizontal: 5,
        paddingTop: 10,
        paddingBottom: 40,
        marginHorizontal: 10,
        marginTop:10,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 20,
        gap: 20
    },
    listBox : {
        flex: 1,
        height:200,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: 'gray',
    },
    items : {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'gray'
    }
});
export default Attain;