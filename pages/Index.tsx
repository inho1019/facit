import { useCallback, useEffect, useRef, useState } from "react";
import Main from "./main/Main";
import { Button, Dimensions, Image, Keyboard, Modal, PermissionsAndroid, Platform, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import Attain from "./main/Attain";
import AsyncStorage from "@react-native-async-storage/async-storage";
import PushNotification from "react-native-push-notification";

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
        channelName: "목표 알람",
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

    //////////////////////Attain//////////////////////
    const [date,setDate] = useState(new Date());
    const [startDate,setStartDate] = useState(new Date());
    const [endDate,setEndDate] = useState(new Date());
    const [attainType,setAttainType] = useState<AttainType>("date")

    const onDate = (date : Date) => {
        setDate(date)
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
        setDate(date)
        setAttainType("date")
        requestAnimationFrame(() => {
            setPage(1)
            scrollRef.current?.scrollTo({x: windowWidth, animated: true})
        })
    }
    //////////////////////////////////////////////////

    const [key,setKey] = useState(false)
    const [todoList,setTodoList] = useState<TodoDTO[]>([])
    const [routineList,setRoutineList] = useState<RoutineDTO[]>([])
    const [todoId,setTodoId] = useState<number>(1)
    const [routineId,setRoutineId] = useState<number>(1)

    const [later,setLater] = useState<boolean>(false)
    const [latId,setLatId] = useState<number>(-1)

    const [reData,setReData] = useState<boolean>(false)

    const [todoModal,setTodoModal] = useState<boolean>(false)
    const [todoModalId,setTodoModalId] = useState<number>(-1)

    const [rouDate,setRoutineDate] = useState<Date>(new Date())
    const [routineModal,setRoutineModal] = useState<boolean>(false)
    const [routineModalId,setRoutineModalId] = useState<number>(-1)

    const [page,setPage] = useState<number>(0)

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
        if (Platform.OS === 'android') {
            const requestAlarmPermission = async () => {
                try {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                        {
                            title: 'Alarm Permission',
                            message: 'App needs permission for alarm access',
                buttonPositive: 'OK',
                },
            )
            if(granted === PermissionsAndroid.RESULTS.GRANTED){
                console.log('success');
            }else {
                console.log('Please alarm permission');
            }
        } catch (err) {
            console.log('Alarm permission err');
            console.warn(err);
        }
        };
            requestAlarmPermission();
        }

        PushNotification.configure({
        
            onNotification: function (notification) {
                if(parseInt(notification.id) > 0) {
                    setTodoModal(true)
                    setTodoModalId(parseInt(notification.id))
                }
                if(parseInt(notification.id) === 0) {
                    requestAnimationFrame(() => {
                        const newDate = new Date()
                        newDate.setDate(newDate.getDate() - 1)
                        scrollRef.current?.scrollTo({x: windowWidth, animated: true})
                        setDate(newDate)
                        setPage(1)
                    })
                }
                if(parseInt(notification.id) < 0) {
                    setRoutineDate(new Date())
                    setRoutineModal(true)
                    setRoutineModalId(-parseInt(notification.id))
                }
            },


            requestPermissions: Platform.OS === 'ios'
          });

        const newDate = new Date()
        newDate.setDate(newDate.getDate() + 1)
        newDate.setHours(0)
        newDate.setMinutes(1)
        newDate.setSeconds(0)

        PushNotification.localNotificationSchedule({
            channelId: "day",
            tag: "day",
            title: "매일 알림",
            message: "어제의 목표 달성도를 확인해보세요!",
            date: newDate,
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
        if(todoId !== 1) {
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
        if(routineId !== 1) {
            setData();
        }
    },[routineId])

    useEffect(() => {
        const setData = async () => {
            try {
                AsyncStorage.setItem("todoList", JSON.stringify(todoList))
            } catch (error) {
                console.error('저장 중 오류 발생', error);
            }
        }
        if(todoId !== 1) {
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
        if(routineId !== 1) {
            setData();
        }
    },[routineList])
    
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
    },[reData])

    useEffect(() => {
        alarmSet();
    },[routineModal,todoModal,routineList])
    
    //////////////////////////////////////////////////

    const onTodoAlarm = (alarmId : number,newDate : Date) => {
        const alarmTodo = todoList.find(fd => fd.id === alarmId);
        const message = alarmTodo ? alarmTodo.content : "목표";

        PushNotification.localNotificationSchedule({
            channelId: "todo",
            tag: "todo",
            title: newDate.getHours().toString().padStart(2, '0') + "시 " + newDate.getMinutes().toString().padStart(2, '0') + "분 목표 알림",
            message: message,
            date: newDate,
            vibration: 3000,
            id: alarmId
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
                !(item.end && dateToInt(item.endDate) >= dateToInt(new Date()))
            ) {     
                PushNotification.localNotificationSchedule({
                    channelId: "routine",
                    tag: "routine",
                    title: ifDate.getHours().toString().padStart(2, '0') + "시 " + ifDate.getMinutes().toString().padStart(2, '0') + "분 루틴 알림",
                    message: item.content || "루틴",
                    date: ifDate,
                    vibration: 3000,
                    id: -item.id
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

    const globalFont =  'black'

    return (
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()} disabled={!key}>
            <View style={{flex:1}}>
                <ScrollView
                    ref={ scrollRef }
                    pagingEnabled
                    horizontal
                    keyboardShouldPersistTaps='handled'
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{width: `200%`}}
                    scrollEventThrottle={50}
                    onMomentumScrollEnd={pageChange}
                    decelerationRate="fast"
                >
                    <Main globalFont={globalFont} keys={key} routineId={routineId} later={later} latId={latId}
                        onSetLatId={onSetLatId} onSetLater={onSetLater} onAttain={onAttain}
                        onTodoAlarm={onTodoAlarm} onCancelAlarm={onCancelAlarm} onTodoDTO={onTodoDTO} onTodoCheck={onTodoCheck}
                        onRoutineCheck={onRoutineCheck} onMove={onMove} onTodoDelete={onTodoDelete} onRoutineDTO={onRoutineDTO}
                        onRoutineEnd={onRoutineEnd} onRoutineRe={onRoutineRe} onRoutineUpdate={onRoutineUpdate} 
                        todoList={todoList} routineList={routineList}/>
                    <Attain globalFont={globalFont} todoList={todoList} routineList={routineList} date={date} page={page}
                        type={attainType} startDate={startDate} endDate={endDate} onStartDate={onStartDate} onEndDate={onEndDate}
                        onDate={onDate} onAttainType={onAttainType}/>
                </ScrollView>
                <Modal
                    animationType="fade"
                    transparent={true}
                    visible={todoModal}
                >
                    <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                        <View style={styles.rouModal}>
                            <Text style={[styles.modalTitle,{color:globalFont}]}>목표 확인</Text>
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
                        <View style={styles.rouModal}>
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
    rouModal : {
        backgroundColor: 'white',
        width: '90%',
        paddingVertical: 10,
        paddingHorizontal: 5,
        borderRadius: 10,
        elevation: 5,
    },
})

export default Index;