import { useEffect, useMemo, useRef } from "react";
import { Animated, Dimensions, Easing, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RoutineDTO, TodoDTO } from "../Index";
import { AnimatedCircularProgress } from 'react-native-circular-progress';

interface Props {
    globalFont: string;
    todoList: TodoDTO[];
    routineList: RoutineDTO[];
    page: number;
    date: Date;
    onDate: (date: Date) => void;
}
   

const Attain: React.FC<Props> = ({globalFont,todoList,routineList,page,date,onDate}) => {

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

    const todoFillList: TodoDTO[] = useMemo(() => {
        return todoList.filter(todo => dateToInt(todo.date) === dateToInt(date))
    },[todoList,page,date])

    const routineFillList: RoutineDTO[] = useMemo(() => {
        return routineList.filter(rou => new Date(rou.startDate) < date && (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])
    },[routineList,page,date])
          
    
    const todoFill = useMemo(() => 
        todoFillList.filter(todo => todo.success).length / todoFillList.length * 100
    ,[todoFillList,page,date]);
    
    const routineFill = useMemo(() => 
        routineFillList.filter(rou => rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).length / routineFillList.length * 100
    ,[routineFillList,page,date]);

    const totalFill = useMemo(() => {
        if (todoFillList.length + routineFillList.length === 0) {
            return 0;
        }
        return (todoFillList.filter(todo => todo.success).length + routineFillList.filter(rou => rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).length) /
        (todoFillList.length + routineFillList.length) * 100
    },[todoFillList,routineFillList]);


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
    },[page,date])

    return(
        <ScrollView style={{flex:1}}>
            <Text style={[styles.topTitle,{color:globalFont}]}>달성</Text>
            <View style={styles.attainBox}>
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
                </View>
                <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                    <AnimatedCircularProgress
                        ref={circleRef1}
                        size={Math.floor(windowWidth*0.5 - 50)}
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
                                <Text style={{fontWeight:'bold', color:globalFont}}>계획</Text>
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
                        tintColor="#2E8DFF"
                        backgroundColor="aliceblue"
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
                    <Text style={{fontWeight:'bold', color:globalFont,marginLeft:10,marginBottom:2}}>총 달성도</Text>
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
            <View style={[styles.attainBox,{marginBottom:10}]}>
                <Text style={[styles.h2,{color:globalFont,marginLeft:10}]}>달성 목록</Text>
                <View style={{flexDirection:'row',justifyContent:'space-around'}}>
                    <Text style={[styles.h4,{color:globalFont}]}>계획</Text>
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
        fontSize: 25,
        fontWeight: 'bold',
        margin : 20,
        marginBottom: 0
    },
    attainBox : {
        paddingHorizontal: 5,
        paddingTop: 10,
        paddingBottom: 40,
        marginHorizontal: 10,
        marginTop:20,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 20,
        gap: 20
    },
    listBox : {
        flex: 1,
        height:200,
        borderWidth: 1,
        borderColor: 'lightgray',
        borderRadius: 3
    },
    items : {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'lightgray'
    }
});
export default Attain;