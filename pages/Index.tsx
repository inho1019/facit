import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Main from "./main/Main";
import { NativeModules, Dimensions, Image, Keyboard, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View, SafeAreaView, KeyboardAvoidingView, LogBox } from "react-native";
import Attain from "./main/Attain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PushNotification from "react-native-push-notification";
import Setting from "./main/Setting";
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import DraggableFlatList from "react-native-draggable-flatlist";
const SharedStorage = NativeModules.SharedStorage;


export type AttainType = "date" | "week" | "month" | "year" | "custom"

export type TodoDTO = {
    id : number,
    content : string,
    success : boolean,
    alarm : boolean,
    alarmDate : Date,
    time : any,
    date : Date
}

export type RoutineDTO = {
    id : number,
    content : string,
    term : boolean[]
    startDate : Date,
    end : boolean,
    endDate : Date,
    success : Date[],
    alarm : boolean,
    alarmDate : Date,
    time : any,
}

PushNotification.createChannel(
    {
        channelId: "todo", 
        channelName: "계획 알람",
        importance: 4, 
        vibrate: true, 
    },
    (created: boolean) => console.log(`createChannel riders returned '${created}'`) 
);
PushNotification.createChannel(
    {
        channelId: "routine", 
        channelName: "루틴 알람",
        importance: 4, 
        vibrate: true, 
    },
    (created: boolean) => console.log(`createChannel riders returned '${created}'`) 
);
PushNotification.createChannel(
    {
        channelId: "day", 
        channelName: "매일 알람",
        importance: 4, 
        vibrate: true, 
    },
    (created: boolean) => console.log(`createChannel riders returned '${created}'`) 
);

const Index: React.FC = () => {


    const scrollRef = useRef<ScrollView>(null)
    
    const windowWidth = Dimensions.get('window').width;

    ////////////////////Theme//////////////////////
    const [first,setFirst] = useState<boolean>(true)
    const [theme,setTheme] = useState<"white" | "black">("white")

    const onTheme = () => {
        setTheme(item => item === "white" ? "black" : "white")
    }

    const globalBack = useMemo<string>(() => {
        if(theme === "white") {
            return "white"
        } else {
            return "#2B2B2B"
        }
    },[theme])

    const globalFont = useMemo<string>(() => {
        if(theme === "white") {
            return "black"
        } else {
            return "white"
        }
    },[theme])

    useEffect(() => {
        setTimeout(() => {
            setLoading(false)    
            PushNotification.configure({
                onNotification: function (notification) {
                    console.log(notification)
                    if(parseInt(notification.id) > 0) {
                        setTodoModal(true)
                        setTodoModalId(parseInt(notification.id))
                        scrollRef.current?.scrollTo({x: 0, animated: true})
                        setPage(0)
                    }
                    if(parseInt(notification.id) == 0) {
                        requestAnimationFrame(() => {
                            const newDate = new Date()
                            newDate.setDate(newDate.getDate() - 1)
                            scrollRef.current?.scrollTo({x: windowWidth, animated: true})
                            setAttainDate(newDate)
                            setPage(1)
                        })
                    }
                    if(parseInt(notification.id) < 0) {
                        setRoutineDate(new Date())
                        setRoutineModal(true)
                        setRoutineModalId(-parseInt(notification.id))
                        scrollRef.current?.scrollTo({x: 0, animated: true})
                        setPage(0)
                    }

                    notification.finish(PushNotificationIOS.FetchResult.NoData);
                },


                requestPermissions: Platform.OS === 'ios'
            });
        },1000)
        const getData = async () => {
            try {
                const themeData = await AsyncStorage.getItem("theme");
                if (themeData !== null) {
                    setTheme(themeData as "white" | "black")
                }
            } catch (error) {
                console.error('불러오기 중 오류 발생', error);
            }
        }
        getData();
    },[])
    //////////////////////Attain//////////////////////
    const [attainDate,setAttainDate] = useState(new Date());
    const [startDate,setStartDate] = useState(new Date());
    const [endDate,setEndDate] = useState(new Date());
    const [attainType,setAttainType] = useState<AttainType>("date")

    const onDate = (date : Date) => {
        setAttainDate(date)
    }
    const onEndDate = (date : Date) => {
        setEndDate(date)
    }
    const onStartDate = (date : Date) => {
        setStartDate(date)
    }
    const onAttainType = (type : AttainType) => {
        setAttainType(type)
    }

    const onAttain = (date : Date) => {
        setAttainDate(date)
        setAttainType("date")
        requestAnimationFrame(() => {
            setPage(1)
            scrollRef.current?.scrollTo({x: windowWidth, animated: true})
        })
    }
    //////////////////////////////////////////////////

    const [key,setKey] = useState<boolean>(false)
    const [todoList,setTodoList] = useState<TodoDTO[]>([])
    const [routineList,setRoutineList] = useState<RoutineDTO[]>([])
    const [todoId,setTodoId] = useState<number>(3)
    const [routineId,setRoutineId] = useState<number>(3)

    const [loading,setLoading] = useState<boolean>(true)

    const [later,setLater] = useState<boolean>(false)
    const [latId,setLatId] = useState<number>(-1)

    const [reData,setReData] = useState<boolean>(false)

    const [todoModal,setTodoModal] = useState<boolean>(false)
    const [todoModalId,setTodoModalId] = useState<number>(-1)

    const [rouDate,setRoutineDate] = useState<Date>(new Date())
    const [routineModal,setRoutineModal] = useState<boolean>(false)
    const [routineModalId,setRoutineModalId] = useState<number>(-1)

    const [page,setPage] = useState<number>(0)

    const [scrollActive,setScrollActive] = useState<boolean>(true)

    const onScrollActive = (bool : boolean) => { setScrollActive(bool) } 

    const dateToInt = (date : Date | string) => {
        const newDate = new Date(date)
        const numDate = new Date(newDate.getFullYear(),newDate.getMonth(),newDate.getDate())

        return numDate.getTime();
    }

    const pageChange = (event:any) => {
        const offsetX = event.nativeEvent.contentOffset.x;
        const pageIndex = Math.round(offsetX / event.nativeEvent.layoutMeasurement.width);
        setPage(pageIndex);
    }

    useEffect(() => {
        LogBox.ignoreAllLogs()

        if (Platform.OS === 'android') {
            const permisson = async () => {
                let permissions = [
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                ]  
                PermissionsAndroid.requestMultiple(permissions)
                .then((status) => {
                    console.log(status)
                    console.log('permission granted');
                })
                .catch((err) => {
                    console.log(err);
                });
            }
            permisson();
        }

        const newDate = new Date()
        newDate.setDate(newDate.getDate() + 1)
        newDate.setHours(0)
        newDate.setMinutes(1)
        newDate.setSeconds(0)

        PushNotification.localNotificationSchedule({
            channelId: "day",
            tag: "day",
            title: "매일 알림",
            message: "어제의 계획 달성도를 확인해보세요!",
            date: newDate,
            smallIcon: "ic_launcher_square_adaptive_fore",
            id: 0
        });


        const keyShow = () => {
            setKey(true)
        };
        
        const keyHide = () => {
            setKey(false)
        };
        
        const keyShowListner = Keyboard.addListener('keyboardDidShow', keyShow);
        const keyHideListner = Keyboard.addListener('keyboardDidHide', keyHide);

        return () => {
            keyShowListner.remove();
            keyHideListner.remove();
        };
    },[])
    ////////데이터 저장 및 불러오기////////
    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("todoId",todoId.toString())
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(todoId !== 3) {
            setData();
        }
    },[todoId])

    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("routineId",routineId.toString())
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(routineId !== 3) {
            setData();
        }
    },[routineId])

    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("todoList", JSON.stringify(todoList))
                if(Platform.OS === 'android') {
                    SharedStorage.set(JSON.stringify(todoList))
                }
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(todoId !== 3) {
            setData();
        }
    },[todoList])

    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("routineList", JSON.stringify(routineList))
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(routineId !== 3) {
            setData();
        }
    },[routineList])

    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("theme", theme)
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(!first) {
            setData();
        }
    },[theme])
    
    useEffect(() => {
        const getData = async () => {

            try {
                const toId = await AsyncStorage.getItem("todoId");
                const toList = await AsyncStorage.getItem("todoList");
                const rouId = await AsyncStorage.getItem("routineId");
                const rouList = await AsyncStorage.getItem("routineList");

                if (toId !== null) {
                    setTodoId(parseInt(toId))
                }
                if (toList !== null) {
                    const typeList : TodoDTO[] = JSON.parse(toList, (key, value) => {
                        if (key === 'date' || key === 'alarmDate') {
                            return new Date(value);
                        }
                        return value;
                    })
                    const setList = typeList.map(item => {
                        if(new Date() > new Date(item.alarmDate)) {
                            return {...item, alarm : false}
                        } else {
                            return item
                        }
                    })
                    setTodoList(setList);
                }
                if (rouId !== null) {
                    setRoutineId(parseInt(rouId))
                }
                if (rouList !== null) {
                    const typeList : RoutineDTO[] = JSON.parse(rouList, (key, value) => {
                        if (key === 'date' || key === 'alarmDate') {
                            return new Date(value);
                        }
                        return value;
                    })
                    setRoutineList(typeList);
                }
            } catch (error) {
                console.error('불러오기 중 오류 발생', error);
            }
        }
        getData();
        setFirst(false)
    },[reData])

    useEffect(() => {
        alarmSet();
    },[routineModal,todoModal,routineList])

    useEffect(() => {
        const date = new Date()
        if(Platform.OS === 'android') {
        SharedStorage.set(
            JSON.stringify({
                date: `${(date.getMonth()+1).toString().padStart(2, '0')}월 ${(date.getDate()).toString().padStart(2, '0')}일 ${date.getDay() === 0 ? '일' : date.getDay() === 1 ? '월' : 
                    date.getDay() === 2 ? '화' : date.getDay() === 3 ? '수' : date.getDay() === 4 ? '목' : date.getDay() === 5 ? '금' : '토'}요일`,
                data:  [...routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])?.map( item => {
                    return {content : item.content, success : item.success.findIndex(fd => dateToInt(fd) === dateToInt(date)) !== -1, id: item.id}
                }),
                ...todoList.filter(item => dateToInt(item.date) === dateToInt(date)).map( item => {
                    return {content : item.content, success : item.success,  id: item.id }
                })]
                // todo: todoList.find(item => dateToInt(item.date) === dateToInt(date) && item.success === false) ? 
                //     todoList.filter(item => dateToInt(item.date) === dateToInt(date) && item.success === false).map( item => '\u25A1  ' + item.content).join('\n'): 
                //     "미완료 계획가 없습니다.",
                // routine: routineList.find(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && 
                //         rou.term[date.getDay()]) ? routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                //         (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])?.map( item => '\u25A1  ' + item.content).join('\n') : 
                //     "미완료 루틴이 없습니다."
            }))
        }
    },[todoList,routineList,reData])
    
    useEffect(() => Keyboard.dismiss(),[page])
    //////////////////////////////////////////////////

    const onTodoAlarm = (alarmId : number,newDate : Date) => {
        const alarmTodo = todoList.find(fd => fd.id === alarmId);
        const message = alarmTodo ? alarmTodo.content : "계획";

        PushNotification.localNotificationSchedule({
            channelId: "todo",
            tag: "todo",
            title: newDate.getHours().toString().padStart(2, '0') + "시 " + newDate.getMinutes().toString().padStart(2, '0') + "분 계획 알림",
            message: message,
            date: newDate,
            vibration: 3000,
            id: alarmId,
            smallIcon: "ic_launcher_square_adaptive_fore",
        });

        setTodoList(list => list.map(item => {
            if(item.id === alarmId) {
                return {...item, alarm : true, alarmDate : newDate}
            } else {
                return item
            }
        }))
        setReData(item => !item)
    } 

    const onCancelAlarm = (id : number) => {

        PushNotification.cancelLocalNotification((id).toString());

        setTodoList(list => list.map(item => {
            if(item.id === id) {
                return {...item, alarm : false, alarmDate : new Date()}
            } else {
                return item
            }
        }))
    }

    const deleteAlarm = (id : number) => {
        PushNotification.cancelLocalNotification((id).toString());
    }

    const addAlarm = (id : number, date : Date, content : string) => {
        PushNotification.localNotificationSchedule({
            channelId: "todo",
            tag: "todo",
            title: date.getHours().toString().padStart(2, '0') + "시 " + date.getMinutes().toString().padStart(2, '0') + "분 계획 알림",
            message: content,
            date: date,
            vibration: 3000,
            id: id,
            smallIcon: "ic_launcher_square_adaptive_fore",
        });
    }
    //////////////////////////////////////////////////

    const onRoutineUpdate = (routineId : number, alarm : boolean, newDate : Date, term : boolean[]) => {
        setRoutineList(routineList.map(item => {
            if(item.id === routineId) {
                return {...item, alarm : alarm, alarmDate : newDate, term : term}
            } else {
                return item
            }
        }))
        setReData(item => !item)
    } 

    const onRoutineUpdateContent = (routineId : number, content : string) => {
        setRoutineList(routineList.map(item => {
            if(item.id === routineId) {
                return {...item, content : content}
            } else {
                return item
            }
        }))
        setReData(item => !item)
    } 

    //////////////////////////////////////////////////

    const onTodoDTO = (todoDTO : TodoDTO) => {
        setTodoList(item => {
            return [...item,{...todoDTO, id : todoId}]
        })
        setTodoId(item => item + 1)

        setReData(item => !item)
    }

    const onTodoCheck = (id : number) => {
        setTodoList(list => list.map(item => {
            if(item.id === id) {
                return {...item, success: !item.success}
            } else {
                return item
            }
        }))
    }

    const onTodoUpdateContent = (id : number, content : string) => {
        setTodoList(list => list.map(item => {
            if(item.id === id) {
                return {...item, content: content}
            } else {
                return item
            }
        }))
    }

    const onTodoSuccess = (id : number) => {
        setTodoList(list => list.map(item => {
            if(item.id === id) {
                return {...item, success: true}
            } else {
                return item
            }
        }))
    }

    const onTodoDelete = (id : number) => {

        PushNotification.cancelLocalNotification((id).toString());

        setTodoList(list => {
            return [...list.filter( filt => filt.id !== id )]
        })
    }

    const onMoveTodo = (date: Date, list: TodoDTO[] ) => {
        setTodoList([...todoList.filter(todo => dateToInt(todo.date) !== dateToInt(date)),...list])
    }

    //////////////////////////////////////////////////

    const onRoutineCheck = (id : number,date : Date) => {
        setRoutineList(list => list.map(item => {
            if(item.id === id) {
                if(item.success.findIndex(fd => dateToInt(fd) === dateToInt(date)) === -1) {
                    return {...item,success : [...item.success, date]};
                } else {
                    return {...item,success : item.success.filter(filt => dateToInt(filt) !== dateToInt(date))};
                }
            } else {
                return item
            } 
        }))
    }

    const onRoutineSuccess = (id : number,date : Date) => {
        setRoutineList(list => list.map(item => {
            if(item.id === id) {
                if(item.success.findIndex(fd => dateToInt(fd) === dateToInt(date)) === -1) {
                    return {...item,success : [...item.success, date]};
                } else {
                    return {...item};
                }
            } else {
                return item
            } 
        }))
    }

    const onRoutineDTO = (routineDTO : RoutineDTO) => {
        setRoutineList(item => [...item,routineDTO])
        setRoutineId(item => item + 1)

        setReData(item => !item)
    }

    const onRoutineEnd = (id : number, date : Date) => {
        setRoutineList(list => {
            return list.map(item => 
              item.id === id
                ? { ...item, end: true, endDate: date }
                : item
            );
          });
    }

    const onRoutineRe = (id : number) => {
        setRoutineList(list => {
            return list.map(item => 
              item.id === id
                ? { ...item, end: false }
                : item
            );
          });
    }

    const onTodo = (list : TodoDTO[]) => {
        setTodoList(list)
        setReData(item => !item)
    }

    const onRoutine = (list : RoutineDTO[]) => {
        setRoutineList(list)
        setReData(item => !item)
    }

    const onTodoId = (id : number) => {
        setTodoId(id)
        setReData(item => !item)
    }

    const onRoutineId = (id : number) => {
        setRoutineId(id)
        setReData(item => !item)
    }

    const onMoveRoutine = (date: Date, list : RoutineDTO[] ) => {
        setRoutineList([...routineList.filter(rou => !(dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])),...list])
    }


    /////////////////////////////////////////////////

    const onMove = (dt : Date , latId : number) => {
        setTodoList(list => {
            const newItem: TodoDTO | undefined = list.find(fd => fd.id === latId);

            if (newItem) {
                return [ {...newItem,date : dt},...list.filter( filt => filt.id !== latId ) ]
            } else {
                return list
            }
        })
    }

    const onSetLater = (bool : boolean) => {
        setLater(bool)
    }

    const onSetLatId = (id : number) => {
        setLatId(id)
    }

    const closeTodoModal = () => {
        setTodoModal(false)
        setTodoModalId(-1)
    }

    const closeRoutineModal = () => {
        setRoutineDate(new Date())
        setRoutineModal(false)
        setRoutineModalId(-1)
    }

    const alarmSet = useCallback(() => {
        routineList.map(item => {
            const itemDate = new Date(item.alarmDate)
            const ifDate = new Date()
            ifDate.setHours(itemDate.getHours())
            ifDate.setMinutes(itemDate.getMinutes())
            ifDate.setSeconds(0)

            if(item.alarm && 
                item.term[new Date().getDay()] && 
                new Date() < ifDate &&
                item.success.findIndex(fd => dateToInt(fd) === dateToInt(new Date())) === -1 &&
                !(item.end && dateToInt(item.endDate) >= dateToInt(new Date()))
            ) {     
                PushNotification.localNotificationSchedule({
                    channelId: "routine",
                    tag: "routine",
                    title: ifDate.getHours().toString().padStart(2, '0') + "시 " + ifDate.getMinutes().toString().padStart(2, '0') + "분 루틴 알림",
                    message: item.content || "루틴",
                    date: ifDate,
                    vibration: 3000,
                    id: -item.id,
                    smallIcon: "ic_launcher_square_adaptive_fore",
                });
            } else {
                PushNotification.cancelLocalNotification((-item.id).toString());
            }
        })

        const setList = todoList.map(item => {
            if(new Date() > new Date(item.alarmDate)) {
                return {...item, alarm : false}
            } else {
                return item
            }
        })
        setTodoList(setList);
    },[routineList,todoList])

    const onLoading = (bool : boolean) => {
        setLoading(bool)
        if(!bool) {
            scrollRef.current?.scrollTo({x: 0, animated: false})
            setPage(0)
        }
    }

    if(loading) {
        return <View style={{backgroundColor:globalBack,justifyContent:'center',alignItems:'center',flex:1}}>
            <Image source={ require(  '../assets/image/facit.png') } style={{width:200,height:200}}/>
        </View>
    }

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
            <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} disabled={!key}>
                <View style={{flex:1,backgroundColor:globalBack}}>
                    <ScrollView
                        ref={ scrollRef }
                        pagingEnabled
                        scrollEnabled={scrollActive}
                        horizontal
                        keyboardShouldPersistTaps='handled'
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{width: `300%`}}
                        scrollEventThrottle={50}
                        onMomentumScrollEnd={pageChange}
                        decelerationRate="fast"
                    >
                        <Main globalFont={globalFont} keys={key} routineId={routineId} later={later} latId={latId}
                            onSetLatId={onSetLatId} onSetLater={onSetLater} onAttain={onAttain} onMoveTodo={onMoveTodo} onMoveRoutine={onMoveRoutine}
                            onTodoAlarm={onTodoAlarm} onCancelAlarm={onCancelAlarm} onTodoDTO={onTodoDTO} onTodoCheck={onTodoCheck}
                            onRoutineCheck={onRoutineCheck} onMove={onMove} onTodoDelete={onTodoDelete} onRoutineDTO={onRoutineDTO}
                            onRoutineEnd={onRoutineEnd} onRoutineRe={onRoutineRe} onRoutineUpdate={onRoutineUpdate} onScrollActive={onScrollActive}
                            onTodoUpdateContent={onTodoUpdateContent} onRoutineUpdateContent={onRoutineUpdateContent}
                            todoList={todoList} routineList={routineList} globalBack={globalBack} theme={theme}/>
                        <Attain globalFont={globalFont} todoList={todoList} routineList={routineList} date={attainDate} page={page} keys={key}
                            type={attainType} startDate={startDate} endDate={endDate} onStartDate={onStartDate} onEndDate={onEndDate}
                            onDate={onDate} onAttainType={onAttainType} globalBack={globalBack} theme={theme}/>
                        <Setting routineList={routineList} todoList={todoList} globalFont={globalFont} globalBack={globalBack} theme={theme}
                            todoId={todoId} routineId={routineId} onTodoId={onTodoId} onRoutineId={onRoutineId} deleteAlarm={deleteAlarm} addAlarm={addAlarm}
                            onTheme={onTheme} onTodo={onTodo} onRoutine={onRoutine} onLoading={onLoading}/>
                    </ScrollView>
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={todoModal}
                    >
                        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                            <View style={[styles.modal,{backgroundColor: globalBack}]}>
                                <Text style={[styles.modalTitle,{color:globalFont}]}>계획 확인</Text>
                                <Text style={{color: globalFont,fontSize:16,paddingVertical:10,paddingHorizontal:20}}>
                                    {todoList.find(fd => fd.id === todoModalId)?.content}
                                </Text>
                                <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                                <Pressable
                                    onPress={closeTodoModal}>
                                        <Image source={ require(  '../assets/image/cancel.png') } 
                                            style={styles.modalBut}/>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        onTodoSuccess(todoModalId)
                                        closeTodoModal()
                                    }}
                                    >
                                    <Image source={ require(  '../assets/image/check.png') } 
                                        style={styles.modalBut}/>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        closeTodoModal()
                                        onSetLatId(todoModalId)
                                        onSetLater(true)
                                    }}
                                    >
                                    <Image source={ require(  '../assets/image/later.png') } 
                                        style={styles.modalBut}/>
                                </Pressable>
                            </View>
                            </View>
                        </View>
                    </Modal>
                    <Modal
                        animationType="fade"
                        transparent={true}
                        visible={routineModal}
                    >
                        <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                            <View style={[styles.modal,{backgroundColor: globalBack}]}>
                                <Text style={[styles.modalTitle,{color:globalFont}]}>루틴 확인</Text>
                                <Text style={{color: globalFont,fontSize:16,paddingVertical:10,paddingHorizontal:20}}>
                                    {routineList.find(fd => fd.id === routineModalId)?.content}
                                </Text>
                                    <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                                <Pressable
                                    onPress={closeRoutineModal}>
                                        <Image source={ require(  '../assets/image/cancel.png') } 
                                            style={styles.modalBut}/>
                                </Pressable>
                                <Pressable
                                    onPress={() => {
                                        onRoutineSuccess(routineModalId,rouDate)
                                        closeRoutineModal()
                                    }}
                                    >
                                    <Image source={ require(  '../assets/image/check.png') } 
                                        style={styles.modalBut}/>
                                </Pressable>
                            </View>
                            </View>
                        </View>
                    </Modal>
                </View>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    )
}

const styles = StyleSheet.create({
    modalBut : {
        width: 35,
        height: 35,
        margin: 10
    },
    modalTitle : {
        fontSize : 21,
        marginHorizontal: 10,
        fontWeight: 'bold'
    },
    modal : {
        backgroundColor: 'white',
        width: '90%',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
        elevation: 5,
    },
})

export default Index;