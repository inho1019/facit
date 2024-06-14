import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Dimensions, Easing, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { AttainType, RoutineDTO, TodoDTO } from "../Index";
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import { Calendar } from "react-native-calendars";

interface Props {
    type: AttainType;
    globalFont: string;
    todoList: TodoDTO[];
    routineList: RoutineDTO[];
    page: number;
    date: Date;
    startDate: Date;
    endDate: Date;
    keys: boolean;
    globalBack : string;
    theme : "white" | "black";
    onDate: (date: Date) => void;
    onStartDate: (date: Date) => void;
    onEndDate: (date: Date) => void;
    onAttainType: (type: AttainType) => void;
}
   

const Attain: React.FC<Props> = ({globalFont,todoList,routineList,page,date,startDate,endDate,type,keys,globalBack,theme,onDate,onAttainType,onStartDate,onEndDate}) => {

    const nowDate = useMemo(() => new Date(),[page]);

    const dateToInt = (date : Date | string) => {
        const newDate = new Date(date)
        const numDate = new Date(newDate.getFullYear(),newDate.getMonth(),newDate.getDate())

        return numDate.getTime();
    }

    const scrollRef = useRef<ScrollView>(null)
    const inputRef = useRef<TextInput>(null)

    const circleRef1 = useRef<AnimatedCircularProgress>(null);
    const circleRef2 = useRef<AnimatedCircularProgress>(null);

    const aniTot = useRef(new Animated.Value(0)).current
    const aniTxt = useRef(new Animated.Value(0)).current
    const aniBox = useRef(new Animated.Value(1)).current
    const aniMoTxt = useRef(new Animated.Value(0)).current
    const aniBarA = useRef(new Animated.Value(0)).current
    const aniBarB = useRef(new Animated.Value(1)).current

    const [boxHeight,setBoxHeight] = useState<number>(0)
    
    const [calendarModal,setCalendarModal] = useState<boolean>(false)
    
    const [routineModal,setRoutineModal] = useState<boolean>(false)
    const [routineId,setRoutineId] = useState<number>(-1)

    const [startingDay,setStartingDay] = useState<Date | null>()
    const [endingDay,setEndingDay] = useState<Date | null>()

    const markingDates = useMemo<any>(() => {
        if(startingDay && !endingDay) {
            return {
                [startingDay.toISOString().split('T')[0]]: {startingDay: true, color: '#2E8DFF', customTextStyle: {fontWeight: 'bold', color: 'white'}}
            }
        } else if (startingDay && endingDay) {
            let dateRange : any = {};

            let currentDate = new Date(startingDay);
        
            while (currentDate <= endingDay) {
                let dateString : string = currentDate.toISOString().split('T')[0];
                if (dateString === startingDay.toISOString().split('T')[0]) {
                    dateRange[dateString] = { startingDay: true, color: '#2E8DFF', customTextStyle: {fontWeight: 'bold', color: 'white'}};
                } else if (dateString === endingDay.toISOString().split('T')[0]) {
                    dateRange[dateString] = { endingDay: true, color: '#2E8DFF', customTextStyle: {fontWeight: 'bold', color: 'white'} };
                } else {
                    dateRange[dateString] = { color: '#2E8DFF70', customTextStyle: {fontWeight: 'bold', color: 'white'} };
                }
                currentDate.setDate(currentDate.getDate() + 1); // 하루 증가
            }
            return dateRange;
        }
    },[startingDay,endingDay])

    const routineMarkingDates = useMemo<any>(() => {
        const routine = routineList.find(item => item.id === routineId)

        let dateRange : any = {};

        if(routine) {
            for (let i = 0 ; i < routine.success.length ; i++) {
                if( !routine.end || (routine.end && dateToInt(routine.success[i]) < dateToInt(routine.endDate)))  {
                    let dateString : string = new Date(routine.success[i]).toISOString().split('T')[0];
                    if(dateToInt(routine.success[i]) > dateToInt(new Date())) {
                        dateRange[dateString] = { marked: true, dotColor: 'tomato', customTextStyle: {fontWeight: 'bold', color: 'white'} };
                    } else {
                        dateRange[dateString] = { selected: true, selectedColor: 'tomato', customTextStyle: {fontWeight: 'bold', color: 'white'} };
                    }
                }
            }
        }
        return dateRange;
    },[routineId])

    const onViewLayout = (event : any) => {
        setBoxHeight(event.nativeEvent.layout.height);
    };

    const countWeek = (itemStartDate:Date, weeknum:number, bool:boolean) => {
        let count = 0;
        let currentDate = new Date(dateToInt(itemStartDate) > dateToInt(startDate) || bool ? itemStartDate : startDate);

        const routine = routineList.find(item => item.id === routineId)

        while (dateToInt(currentDate) <= dateToInt( bool ? 
            routine?.end ? routine?.endDate : new Date() : 
                routine?.end ? dateToInt(routine.endDate) < dateToInt(endDate) ? routine.endDate : endDate : endDate)
            - (bool ? routine?.end ? 86400000 : 0 : 
                routine?.end ? dateToInt(routine.endDate) < dateToInt(endDate) ? 86400000 : 0 : 0
            )) {
            if (currentDate.getDay() === weeknum) {
                count++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return count;
    }

    const windowWidth = Dimensions.get('window').width;

    const [typeNumber,setTypeNumber] = useState<number>(0); 
    const [typeLoading,setTypeLoading] = useState<boolean>(false);

    const [search,setSearch] = useState<string>('');

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
            return routineList.filter(rou => !(rou.end && dateToInt(rou.startDate) >= dateToInt(rou.endDate)) && dateToInt(rou.startDate) <= dateToInt(date) && 
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
            return routineList.filter(rou => !(rou.end && dateToInt(rou.startDate) >=  dateToInt(rou.endDate)) && 
                dateToInt(rou.startDate) <= dateToInt(endDate) && 
                (rou.end ? dateToInt(rou.endDate) > dateToInt(startDate) : true) && 
                (dateGap < 7 ? checkArr.some(item => rou.term[item]) : true ))
        }
    },[routineList,page,date,type,startDate,endDate])
          
    
    const todoFill = useMemo(() => 
        todoFillList.filter(todo => todo.success).length / todoFillList.length * 100
    ,[todoFillList,page,date]);
    
    const routineFill = useMemo(() => {
        if (type === "date") {
            return  routineFillList.filter(rou => rou.success.findIndex(item => 
                (dateToInt(item) === dateToInt(date))) !== -1).length / routineFillList.length * 100
        } else {
            const totalRoutineNum : number = routineFillList.map(item => {
                const trueArr : number[] = [];

                item.term.forEach((value, index) => {
                    if (value) {
                        trueArr.push(index);
                    }
                });

                return trueArr.map(num => {
                    return countWeek(item.startDate, num, false)
                }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

            const successRoutineNum : number = routineFillList.map(item => {
                return item.success.filter(dt => dateToInt(dt) >= dateToInt(startDate) && dateToInt(dt) <= dateToInt(endDate)).length
            }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

            return successRoutineNum / totalRoutineNum * 100
        }
    },[routineFillList,page,date]);

    const totalFill = useMemo(() => {
        if (todoFillList.length + routineFillList.length === 0) {
            return 0;
        }
        if (type === "date") {
            return (todoFillList.filter(todo => todo.success).length + routineFillList.filter(rou => rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).length) /
            (todoFillList.length + routineFillList.length) * 100
        } else {
            const totalRoutineNum : number = routineFillList.map(item => {
                const trueArr : number[] = [];

                item.term.forEach((value, index) => {
                    if (value) {
                        trueArr.push(index);
                    }
                });

                return trueArr.map(num => {
                    return countWeek(item.startDate, num, false)
                }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
            }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

            const successRoutineNum : number = routineFillList.map(item => {
                return item.success.filter(dt => dateToInt(dt) >= dateToInt(startDate) && dateToInt(dt) <= dateToInt(endDate)).length
            }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);

            return (todoFillList.filter(todo => todo.success).length + successRoutineNum) /
            (todoFillList.length + totalRoutineNum) * 100
        }
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
            if ( typeNumber === 0) {
                onDate(new Date())
            } else if ( typeNumber === 1) {
                const setStartDate = new Date()
                setStartDate.setDate(setStartDate.getDate()-( nowDate.getDay() === 0 ? 7 : nowDate.getDay() )+1)
                setCalendarModal(false)
                onStartDate(setStartDate)
                onEndDate(nowDate)
            } else if ( typeNumber === 2) {
                const setStartDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
                setCalendarModal(false)
                onStartDate(setStartDate)
                onEndDate(nowDate)
            } else if ( typeNumber === 3) {
                const setStartDate = new Date(nowDate.getFullYear(), 0, 1);
                setCalendarModal(false)
                onStartDate(setStartDate)
                onEndDate(nowDate)
            } else if ( typeNumber === 4) {
                setCalendarModal(true)
                onStartDate(new Date())
                onEndDate(new Date())
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
            circleRef1.current?.animate(todoFill, 1200, Easing.inOut(Easing.quad));
            circleRef2.current?.animate(routineFill, 1200, Easing.inOut(Easing.quad));
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
            circleRef1.current?.animate(0,1,Easing.quad)
            circleRef2.current?.animate(0,1,Easing.quad)
            aniTot.setValue(0);
            aniTxt.setValue(0);
            inputRef.current?.blur();
            setCalendarModal(false);
            setSearch('');
        }
    },[page,date,todoFillList,routineFillList])

    useEffect(() => {
        if (keys) {
            Animated.timing(aniBox, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
        } else {
            Animated.timing(aniBox, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
        }
    },[keys])

    useEffect(() => {
        if(routineModal) {
            const routine = routineList.find(item => item.id === routineId)
            
            if(routine) {
                Animated.timing(aniBarA, {
                    toValue: routineTot(routine,false) === 0 ? 0 : routineSuc(routine) / routineTot(routine,false) * 100 * ((windowWidth * 0.9 - 70) / 100),
                    duration: 1000,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.ease)
                }).start()
                Animated.timing(aniBarB, {
                    toValue: routineTot(routine,true) === 0 ? 0 : routineNowSuc(routine) / routineTot(routine,true) * 100 * ((windowWidth * 0.9 - 70) / 100),
                    duration: 1000,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.ease)
                }).start(() => {
                    Animated.timing(aniMoTxt, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                        easing: Easing.out(Easing.ease)
                    }).start();
                })
            }
        } else {
            aniBarA.setValue(0);
            aniBarB.setValue(0);
            aniMoTxt.setValue(0);
        }   
    },[routineModal,routineId])


    const calendarHeader = (date : Date) => {
        const year = date.getFullYear();
        return <Text style={{fontSize:22,fontWeight:'bold',color: globalFont}}>{year}년 {(date.getMonth() + 1).toString().padStart(2, '0')}월</Text>
    }

    const routineTot = (routineDTO : RoutineDTO | undefined, bool:boolean) => {
        if(routineDTO) {
            const trueArr : number[] = [];
    
            routineDTO.term.forEach((value, index) => {
                if (value) {
                    trueArr.push(index);
                }
            });
    
            return trueArr.map(num => {
                return countWeek(routineDTO.startDate, num, bool)
            }).reduce((accumulator, currentValue) => accumulator + currentValue, 0);
        } else {
            return 0;
        }
    }

    const routineSuc = (routineDTO : RoutineDTO | undefined) => {
        if(routineDTO) {
            return routineDTO.success.filter(dt => dateToInt(dt) >= dateToInt(startDate) && dateToInt(dt) <= dateToInt(endDate)).length
        } else {
            return 0;
        }
    }

    const routineNowSuc = (routineDTO : RoutineDTO | undefined) => {
        if(routineDTO) {
            return routineDTO.success.filter(dt => dateToInt(dt) <= dateToInt(routineDTO.end ? new Date(routineDTO.endDate) : new Date()) - (routineDTO.end ? 86400000 : 0)).length
        } else {
            return 0;
        }
    }

    const sinceUntil = (routineDTO : RoutineDTO | undefined) => {
        if(routineDTO) {
            return routineDTO.end ? `${(new Date(routineDTO.startDate).getFullYear().toString().slice(-2))}.${(new Date(routineDTO.startDate).getMonth()+1).toString().padStart(2, '0')}.${(new Date(routineDTO.startDate).getDate()).toString().padStart(2, '0')} ~ ${(new Date(routineDTO.endDate).getFullYear().toString().slice(-2))}.${(new Date(routineDTO.endDate).getMonth()+1).toString().padStart(2, '0')}.${(new Date(routineDTO.endDate).getDate()).toString().padStart(2, '0')}` :
            `${(new Date(routineDTO.startDate).getFullYear().toString().slice(-2))}.${(new Date(routineDTO.startDate).getMonth()+1).toString().padStart(2, '0')}.${(new Date(routineDTO.startDate).getDate()).toString().padStart(2, '0')} ~`
        } 
    }

    return(
        <View style={{flex:1}}>
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
                        <Image source={ theme === "white" ? require(  '../../assets/image/triangle-black.png') : require(  '../../assets/image/triangle-white.png')} 
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
                        <Image source={ theme === "white" ? require(  '../../assets/image/triangle-black.png') : require(  '../../assets/image/triangle-white.png')} 
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
            <Animated.View style={[styles.attainBox,{backgroundColor: theme === "white" ? 'white' : '#333333',height: aniBox.interpolate({ inputRange: [0, 1], outputRange: [75,boxHeight]})}]}>
                <View style={{ paddingTop: 10, paddingBottom: 40, gap: 20}} onLayout={onViewLayout}>
                    { type === "date" ? 
                    // 일간
                    <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                        <Pressable
                            onPress={() => {
                                onDate(new Date(date.getTime() - 86400000))
                                aniTxt.setValue(0);
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25,height:25, marginTop: 15, transform:[{rotate : '-90deg'}]}}/>
                        </Pressable>
                        <Pressable
                            disabled={dateToInt(date) === dateToInt(new Date())}
                            onPress={() => onDate(new Date())}
                        >
                            <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                                {   dateToInt(date) === dateToInt(new Date()) ? '오늘' :
                                    dateToInt(date) === (dateToInt(new Date())) - 86400000 ? '어제' :
                                    `${(date.getMonth()+1).toString().padStart(2, '0')}월 ${(date.getDate()).toString().padStart(2, '0')}일 ${date.getDay() === 0 ? '일' : date.getDay() === 1 ? '월' : 
                                    date.getDay() === 2 ? '화' : date.getDay() === 3 ? '수' : date.getDay() === 4 ? '목' : date.getDay() === 5 ? '금' : '토'}요일`}
                            </Text>
                        </Pressable>
                        { dateToInt(date) < dateToInt(new Date) ? <Pressable
                            onPress={() => {
                                onDate(new Date(date.getTime() + 86400000))
                                aniTxt.setValue(0);
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                        </Pressable> : <View style={{width:25,height:25}}/>}
                    </View> :
                    // 주간
                    type === "week" ? 
                    <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                        <Pressable
                            onPress={() => {
                                onStartDate(new Date(startDate.getTime() - 86400000 * 7))
                                onEndDate(new Date(startDate.getTime() - 86400000))
                                aniTxt.setValue(0);
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
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
                                    `${(startDate.getMonth()+1).toString().padStart(2, '0')}월 ${(startDate.getDate()).toString().padStart(2, '0')}일 ~ ${(endDate.getMonth()+1).toString().padStart(2, '0')}월 ${(endDate.getDate()).toString().padStart(2, '0')}일`}
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
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                        </Pressable>}
                    </View> :
                    // 월간
                    type === "month" ?
                    <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                        <Pressable
                            onPress={() => {
                                const setStartDate = new Date(startDate.getFullYear(), startDate.getMonth() - 1, 1);
                                onStartDate(setStartDate)
                                const setEndDate = new Date(startDate.getFullYear(), startDate.getMonth(), 0);
                                onEndDate(setEndDate)
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25,height:25, marginTop: 15, transform:[{rotate : '-90deg'}]}}/>
                        </Pressable>
                        <Pressable
                            disabled={( startDate.getFullYear() === new Date().getFullYear() && startDate.getMonth() === new Date().getMonth() )}
                            onPress={() => {
                                aniTxt.setValue(0);
                                const setStartDate = new Date(nowDate.getFullYear(), nowDate.getMonth(), 1);
                                onStartDate(setStartDate)
                                onEndDate(nowDate)
                            }}
                        >
                            <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                                { ( startDate.getFullYear() === new Date().getFullYear() && startDate.getMonth() === new Date().getMonth() ) ? 
                                    '이번달' : `${startDate.getFullYear()}년 ${(startDate.getMonth() + 1).toString().padStart(2, '0')}월`
                                }
                            </Text>
                        </Pressable>
                        { ( startDate.getFullYear() === new Date().getFullYear() && startDate.getMonth() === new Date().getMonth() ) ? 
                        <View style={{width:25,height:25}}/>
                        : <Pressable
                            onPress={() => {
                                aniTxt.setValue(0);
                                const setStartDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
                                onStartDate(setStartDate)
                                const setEndDate = new Date(startDate.getFullYear(), startDate.getMonth() + 2, 0);
                                onEndDate(dateToInt(setEndDate) > dateToInt(nowDate) ? nowDate : setEndDate)
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                        </Pressable>}
                    </View> : 
                    // 연간
                    type === "year" ?
                    <View style={{flexDirection:"row",justifyContent:'space-evenly',alignItems:'center',marginBottom:5}}>
                        <Pressable
                            onPress={() => {
                                aniTxt.setValue(0);
                                const setStartDate = new Date(startDate.getFullYear() - 1, 0, 1);
                                onStartDate(setStartDate)
                                const setEndDate = new Date(startDate.getFullYear() - 1, 11, 31);
                                onEndDate(dateToInt(setEndDate) > dateToInt(nowDate) ? nowDate : setEndDate)
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25,height:25, marginTop: 15, transform:[{rotate : '-90deg'}]}}/>
                        </Pressable>
                        <Pressable
                            disabled={startDate.getFullYear() === new Date().getFullYear() }
                            onPress={() => {
                                aniTxt.setValue(0);
                                const setStartDate = new Date(nowDate.getFullYear(), 0, 1);
                                onStartDate(setStartDate)
                                onEndDate(nowDate)
                            }}
                        >
                            <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                                {startDate.getFullYear() === new Date().getFullYear() ? '올해'  :
                                 startDate.getFullYear() === new Date().getFullYear() - 1 ? '작년' : 
                                 `${startDate.getFullYear()}년`}
                            </Text>
                        </Pressable>
                        { startDate.getFullYear() >= new Date().getFullYear()  ? 
                        <View style={{width:25,height:25}}/>
                        : <Pressable
                            onPress={() => {
                                aniTxt.setValue(0);
                                const setStartDate = new Date(startDate.getFullYear() + 1, 0, 1);
                                onStartDate(setStartDate)
                                const setEndDate = new Date(startDate.getFullYear() + 1, 11, 31);
                                onEndDate(dateToInt(setEndDate) > dateToInt(nowDate) ? nowDate : setEndDate)
                            }}
                        >
                            <Image source={theme === "white" ? require('../../assets/image/arrow-black.png') : require('../../assets/image/arrow-white.png')} 
                                style={{width:25, height:25, marginTop: 15, transform:[{rotate : '90deg'}]}}/>
                        </Pressable>}
                    </View> :
                    // 선택
                    <View style={{flexDirection:"row",justifyContent:'center',alignItems:'center',marginBottom:5}}>
                        <Pressable
                            onPress={() => {
                                aniTxt.setValue(0);
                                setCalendarModal(true)
                            }}
                        >
                            <Text style={[styles.h2,{color:globalFont, marginTop: 10}]}>
                                { dateToInt(startDate) === dateToInt(endDate) ? `${(startDate.getMonth()+1).toString().padStart(2, '0')}월 ${(startDate.getDate()).toString().padStart(2, '0')}일` :
                                    `${(startDate.getMonth()+1).toString().padStart(2, '0')}월 ${(startDate.getDate()).toString().padStart(2, '0')}일 ~ ${(endDate.getMonth()+1).toString().padStart(2, '0')}월 ${(endDate.getDate()).toString().padStart(2, '0')}일`
                                }
                            </Text>
                        </Pressable>
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
                        <Text style={{fontWeight:'bold', color:globalFont,marginLeft:10,marginBottom:2}}>총 달성도</Text>
                        <View style={{width:'100%',backgroundColor: theme === "white" ? 'whitesmoke' : '#444444',borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.5,overflow:'hidden'}}>
                            <Animated.View style={{
                                height:Math.floor(windowWidth*0.5 - 50) * 0.25,
                                width: aniTot,
                                backgroundColor:theme === "white" ? 'lightgray' : "#222222",
                                borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.5}}>
                                    <Animated.Text style={{width:50,fontWeight:'bold', opacity: aniTxt, color:globalFont, position:'absolute', height:Math.floor(windowWidth*0.5 - 50) * 0.25,left: 10,textAlignVertical:'center'}}>{Math.floor(totalFill)}%</Animated.Text>
                            </Animated.View>
                        </View>
                    </View>
                </View>
            </Animated.View>
            <View style={{flex:1,marginBottom:10}}>
                <View style={{flexDirection:'row',justifyContent:'center',alignItems:'center',paddingHorizontal:10,gap:15,marginTop:10}}>
                    <Text style={[styles.h2,{color:globalFont, marginLeft: 5,marginBottom:10,flex:1}]}>달성</Text>
                    <TextInput 
                        ref={inputRef}
                        style={{backgroundColor: globalBack,paddingHorizontal:5,paddingVertical:3,flex:1,
                                marginVertical:5,marginLeft:2,borderWidth:1,borderColor: theme === "white" ? 'darkgray' : 'gray',color:globalFont}}
                        placeholder="검색"
                        placeholderTextColor="gray"
                        onChangeText={(text) => setSearch(text)}
                        value={search}
                    />
                </View>
                <View style={{flexDirection:'row',paddingHorizontal:10,gap:10}}>
                    <View style={{flex:1,backgroundColor: theme === "white" ? 'whitesmoke' : '#222222',paddingVertical:5}}>
                        <Text style={[styles.h4,{color:globalFont,textAlign:'center'}]}>목표</Text>
                    </View>
                    <View style={{flex:1,backgroundColor: theme === "white" ? 'whitesmoke' : '#222222',paddingVertical:5}}>
                        <Text style={[styles.h4,{color:globalFont,textAlign:'center'}]}>루틴</Text>
                    </View>
                </View>
                <View style={{flexDirection:'row',justifyContent:'center',flex:1,paddingHorizontal:10,gap:10}}>
                    <ScrollView style={styles.listBox}>
                        {
                            todoFillList.filter(todo => todo.content.includes(search) && todo.success).map((item,index) => 
                            <Animated.View key={`${item}_${index}`} style={[styles.items,{opacity:aniTxt}]}>
                                <Text style={{color:globalFont,margin:10}}>{item.content}</Text>
                            </Animated.View>)
                        }
                    </ScrollView>
                    <ScrollView style={styles.listBox}>
                        {
                            type === 'date' ?
                            routineFillList.filter(rou => rou.content.includes(search) && rou.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1).map((item,index) => 
                            <Animated.View key={`${item}_${index}`} style={[styles.items,{opacity:aniTxt}]}>
                                <Text style={{color:globalFont,margin:10,flex:1}}>{item.content}</Text>
                                <Pressable
                                    onPress={() => {
                                        setRoutineId(item.id)
                                        setRoutineModal(true)
                                    }}
                                >
                                    <Image source={ theme === "white" ? require(  '../../assets/image/chart-black.png') : require(  '../../assets/image/chart-white.png')}  style={{width:20,height:20,marginRight:10}}/>
                                </Pressable>
                            </Animated.View>) :
                            routineFillList.filter(rou => rou.content.includes(search)).map((item,index) => 
                            <Animated.View key={`${item}_${index}`} style={[styles.items,{opacity:aniTxt}]}>
                                <View
                                    style={{position:'absolute',width: `${routineSuc(item) / routineTot(item,false) * 100}%`,height:7,backgroundColor: 'tomato',bottom:-2}}
                                />
                                <Text style={{color:globalFont,margin:10,flex:1}}>{item.content}</Text>
                                <Pressable
                                    onPress={() => {
                                        setRoutineId(item.id)
                                        setRoutineModal(true)
                                    }}
                                >
                                    <Image source={ theme === "white" ? require(  '../../assets/image/chart-black.png') : require(  '../../assets/image/chart-white.png')}  style={{width:20,height:20,marginRight:10}}/>
                                </Pressable>
                            </Animated.View>)
                        }
                    </ScrollView>
                </View>
            </View>
            <Modal
                animationType="fade"
                transparent={true}
                visible={calendarModal}
            >
                 <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                    <View style={[styles.modal,{backgroundColor: globalBack}]}>
                        <Calendar
                        style={{padding:10}}
                        current={new Date().toISOString().split('T')[0]}
                        renderHeader={ calendarHeader }
                        markedDates={{
                            [new Date().toISOString().split('T')[0]]: { selected: true, customContainerStyle: { backgroundColor: '#2E8DFF50'}, customTextStyle: {fontWeight: 'bold', color: 'white'}},
                            ...markingDates
                        }}
                        onDayPress={(day) => {
                            if(!startingDay) {
                                setStartingDay(new Date(day.dateString))
                            } else if (dateToInt(startingDay) > dateToInt(new Date(day.dateString))) {
                                setStartingDay(new Date(day.dateString))
                            } else {
                                setEndingDay(new Date(day.dateString))
                                requestAnimationFrame(() => {
                                    onStartDate(startingDay)
                                    onEndDate(new Date(day.dateString))
                                    setStartingDay(null)
                                    setEndingDay(null)
                                    aniTxt.setValue(0);
                                    setCalendarModal(false)
                                })
                            }
                        }}
                        markingType={'period'}
                        theme={{
                            'stylesheet.calendar.header': {
                                dayTextAtIndex5: {
                                    color: '#2E8DFF'
                                },
                                dayTextAtIndex6: {
                                    color: 'tomato'
                                }
                            },
                            textSaturdayColor: '#2E8DFF',
                            textSundayColor: 'tomato',
                            arrowColor: globalFont,
                            todayTextColor: globalFont,
                            calendarBackground: globalBack,
                            textDayFontSize: 17,
                            textDayFontWeight: 'bold',
                            dayTextColor: globalFont,
                            textMonthFontSize: 17,
                            textMonthFontWeight: 'bold',
                            textSectionTitleColor: globalFont,      
                        }}
                        firstDay={1}
                        />
                    </View>
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={routineModal}
            >
                 <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                    <View style={[styles.modal,{backgroundColor: globalBack,marginVertical:20}]}>
                        <ScrollView> 
                            <View style={{flexDirection:'row', justifyContent:'space-between',alignItems:'center'}}>
                                <Text style={[styles.modalTitle,{color:globalFont}]}>루틴 상세</Text>
                                <Pressable
                                    onPress={() => {
                                        setRoutineId(-1)
                                        setRoutineModal(false)
                                    }}
                                >
                                    <Image source={ theme === "white" ? require(  '../../assets/image/delete-black.png') : require(  '../../assets/image/delete-white.png')}  
                                        style={{width:30,height:30,marginRight:5}}/>
                                </Pressable>
                            </View>
                            <View style={[styles.modalTxtBox,{backgroundColor:theme === "white" ? 'whitesmoke' : '#222222'}]}>
                                <View style={{flexDirection:'row',justifyContent:"space-between"}}>
                                    <View style={{flexDirection:'row',gap:3}}>
                                        {routineList.find(item => item.id === routineId)?.term.map((item,index) => 
                                            item && 
                                            <Text key={`${item}_${index}`} style={{color:globalFont,backgroundColor:theme === "white" ? 'white' : "#444444",width:20,height:20,borderRadius:10,textAlign:'center',fontSize:12}}>
                                                {index === 1 ? '월' : index === 2 ? '화' : index === 3 ? '수' : index === 4 ? '목' : index === 5 ? '금' : index === 6  ? '토' : '일'}
                                            </Text>
                                        )}
                                    </View>
                                    <Text style={{color:globalFont,backgroundColor:theme === "white" ? 'white' : "#444444",height:20,borderRadius:10,textAlign:'center',paddingHorizontal:7,fontSize:12,paddingTop:2}}>
                                        {sinceUntil(routineList.find(item => item.id === routineId))}
                                    </Text>
                                </View>
                                <Text style={{color:globalFont,margin:5}}>
                                    {routineList.find(item => item.id === routineId)?.content}
                                </Text>
                            </View>
                            { type !== "date" &&
                                <View style={{paddingHorizontal:30,marginTop:20}}>
                                    <Text style={{color:globalFont,marginLeft:10,marginBottom:2}}>
                                        기간 달성도
                                    </Text>
                                    <View style={{width:'100%',backgroundColor: theme === "white" ? 'aliceblue' : '#444444',borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.1,overflow:'hidden'}}>
                                        <Animated.View style={{
                                            height:Math.floor(windowWidth*0.5 - 50) * 0.25,
                                            width: aniBarA,
                                            backgroundColor:theme === "white" ? '#2E8DFF' : "#222222",
                                            borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.1}}>
                                                <Animated.Text style={{width:50,fontWeight:'bold', opacity: aniMoTxt, color:'white', position:'absolute', 
                                                    height:Math.floor(windowWidth*0.5 - 50) * 0.25,left: 10,textAlignVertical:'center'}}>
                                                        {routineSuc(routineList.find(item => item.id === routineId))}/{routineTot(routineList.find(item => item.id === routineId),false)}
                                                </Animated.Text>
                                        </Animated.View>
                                    </View>
                                </View>
                            }
                            <View style={{paddingHorizontal:30,marginTop:20}}>
                                <Text style={{color:globalFont,marginLeft:10,marginBottom:2}}>
                                    전체 달성도
                                </Text>
                                <View style={{width:'100%',backgroundColor: theme === "white" ? 'snow' : '#444444',borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.1,overflow:'hidden'}}>
                                    <Animated.View style={{
                                        height:Math.floor(windowWidth*0.5 - 50) * 0.25,
                                        width: aniBarB,
                                        backgroundColor:theme === "white" ? 'tomato' : "#222222",
                                        borderRadius:Math.floor(windowWidth*0.5 - 50) * 0.1}}>
                                            <Animated.Text style={{width:50,fontWeight:'bold', opacity: aniMoTxt, color:'white', position:'absolute', 
                                                height:Math.floor(windowWidth*0.5 - 50) * 0.25,left: 10,textAlignVertical:'center'}}>
                                                    {routineNowSuc(routineList.find(item => item.id === routineId))}/{routineTot(routineList.find(item => item.id === routineId),true)}
                                            </Animated.Text>
                                    </Animated.View>
                                </View>
                            </View>
                            <Calendar
                                style={{padding:10,marginTop:10}}
                                renderHeader={ calendarHeader }
                                markedDates={{
                                    [new Date().toISOString().split('T')[0]]: { selected: true, selectedColor: '#ff634750', customTextStyle: {fontWeight: 'bold', color: 'white'} },
                                    ...routineMarkingDates
                                }}
                                theme={{
                                    'stylesheet.calendar.header': {
                                        dayTextAtIndex5: {
                                            color: '#2E8DFF'
                                        },
                                        dayTextAtIndex6: {
                                            color: 'tomato'
                                        }
                                    },
                                    textSaturdayColor: '#2E8DFF',
                                    textSundayColor: 'tomato',
                                    arrowColor: globalFont,
                                    calendarBackground: globalBack,
                                    textDayFontSize: 17,
                                    textDayFontWeight: 'bold',
                                    dayTextColor: globalFont,
                                    textMonthFontSize: 17,
                                    textMonthFontWeight: 'bold',
                                    textSectionTitleColor: globalFont,      
                                }}
                                firstDay={1}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    h2 : {
        fontSize: 22,
        fontWeight: 'bold',
    },
    h3 : {
        fontSize: 20,
        fontWeight: 'bold',
    },
    h4 : {
        fontSize: 17,
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
        marginHorizontal: 10,
        marginTop:10,
        elevation: 5,
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
    },
    listBox : {
        flex: 1,
        borderTopWidth: 1,
        borderColor: 'gray',
    },
    items : {
        borderBottomWidth: 1,
        borderBottomColor: 'gray',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    modal : {
        backgroundColor: 'white',
        width: '90%',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
        elevation: 5,
    },
    modalTitle : {
        fontSize : 21,
        marginHorizontal: 10,
        fontWeight: 'bold'
    },
    modalTxtBox : {
        marginTop: 20,
        padding: 13,
        gap: 7,
        marginHorizontal:25,
        borderRadius:20,
    }
});
export default Attain;