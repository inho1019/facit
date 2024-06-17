import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, Keyboard, Modal, PanResponder, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars'
import { RoutineDTO, TodoDTO } from '../Index';

LocaleConfig.locales['ko'] = {
    monthNames: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    monthNamesShort: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    dayNames: ['일', '월', '화', '수', '목', '금', '토'],
    dayNamesShort: ['일', '월', '화', '수', '목', '금', '토'],
};

LocaleConfig.defaultLocale = 'ko';

const windowWidth = Dimensions.get('window').width;

export type ModalDTO = {
    active : boolean,
    type: "routine" | "todo" | null,
    id: number,
    title?: string,
    message?: string,
    subMessage?: string
}

interface Props {
    globalFont: string;
    keys: boolean;
    todoList: TodoDTO[];
    routineList: RoutineDTO[];
    routineId : number;
    later : boolean;
    latId : number;
    globalBack : string;
    theme : "white" | "black";
    onMoveTodo: (frontid : number,moveid : number, dto: TodoDTO) => void;
    onMoveRoutine: (frontid : number,moveid : number, dto: RoutineDTO) => void;
    onSetLater: (bool: boolean) => void;
    onSetLatId: (id: number) => void;
    onTodoAlarm: (alarmId: number, newDate: Date) => void;
    onCancelAlarm: (id: number) => void;
    onTodoCheck: (id: number) => void;
    onTodoDTO: (todoDTO: TodoDTO) => void;
    onTodoDelete: (id: number) => void;
    onRoutineRe: (id: number) => void;
    onRoutineUpdate: (routineId : number, alarm : boolean, newDate : Date, term : boolean[]) => void;
    onRoutineEnd: (id: number, date: Date ) => void;
    onRoutineCheck: (id: number, date: Date) => void;
    onRoutineDTO: (routineDTO: RoutineDTO) => void;
    onMove: (dt: Date, latId: number) => void;
    onAttain: (date: Date) => void;
    onRoutineUpdateContent: (id: number, content: string) => void;
    onTodoUpdateContent: (id: number, content: string) => void;
}

const Main: React.FC<Props> = ({globalFont,keys,todoList,routineList,routineId,later, latId, globalBack, theme,
        onSetLatId, onSetLater,onTodoAlarm,onCancelAlarm,onAttain,onRoutineUpdateContent, onTodoUpdateContent,
        onTodoDTO,onTodoCheck,onTodoDelete,onRoutineEnd,onRoutineRe,onRoutineUpdate, onMoveTodo, onMoveRoutine,
        onRoutineCheck,onRoutineDTO,onMove}) => {


    const dateToInt = (date : Date | string) => {
        const newDate = new Date(date)
        const numDate = new Date(newDate.getFullYear(),newDate.getMonth(),newDate.getDate())

        return numDate.getTime();
    }

    const mainRef = useRef<ScrollView>(null)
    const inputRef = useRef<TextInput>(null)

    const [contentHeight, setContentHeight] = useState(0);
    
    const [week,setWeek] = useState<number[][]>([])
    const [date,setDate] = useState<Date>(new Date())
    const [fold,setFold] = useState<boolean>(true)
    const [todoDTO,setTodoDTO] = useState<TodoDTO>({
        id : -1,
        date : new Date(),
        content : '',
        success : false,
        alarm : false,
        alarmDate : new Date(),
        time : ''
    })
    
    const [openIdx,setOpenIdx] = useState<number>(-1)
    const [aning,setAning] = useState<boolean>(false)
    
    const [routine,setRoutine] = useState<boolean>(false)
    const [rouId,setRouId] = useState<number>(-1)
    const [rouWeek,setRouWeek] = useState<boolean[]>([false,false,false,false,false,false,false])
    const [routineAlarm,setRoutineAlarm] = useState<boolean>(false)

    const [upWeek,setUpWeek] = useState<boolean[]>([false,false,false,false,false,false,false])
    const [upAlarm,setUpAlarm] = useState<boolean>(false)
    const [upModal,setUpModal] = useState<boolean>(false)
    const [upId,setUpId] = useState<number>(-1)
    const [upState,setUpState] = useState<boolean>(false)

    const [upTodoId,setUpTodoId] = useState<number>(-1)
    const [upTodoKey,setUpTodoKey] = useState<boolean>(false)
    const [upTodoContent,setUpTodoContent] = useState<string>('')

    const [upRouId,setUpRouId] = useState<number>(-1)
    const [upRouKey,setUpRouKey] = useState<boolean>(false)
    const [upRouContent,setUpRouContent] = useState<string>('')

    const [alarm,setAlarm] = useState<boolean>(false)
    const [alarmId,setAlarmId] = useState<number>(-1)

    const [calendarVisible,setCalendarVisible] = useState<boolean>(true)

    const [modalConfirm,setModalConfirm] = useState<ModalDTO>({
        active : false,
        type : null,
        id : -1,
        title : '',
        message : ''
    })

    const [calHeight,setCalHeight] = useState<number>(300)

    const [open,setOpen] = useState<boolean>(false)
    const [moveMode,setMoveMode] = useState<'none' | 'todo' | 'routine'>('none')
    const [moveId,setMoveId] = useState<number>(-1)
    const [moveIdx,setMoveIdx] = useState<number>(-1)

    let pressTimeout: NodeJS.Timeout | undefined;

    const onViewLayout = (event : any) => {
        setCalHeight(event.nativeEvent.layout.height);
    };

    const onMoveMode = (id : number,idx : number,mode : 'none' | 'todo' | 'routine') => {
        if(moveMode !== mode) {
            pressTimeout = setTimeout(() => {
                setOpenIdx(-1)
                setMoveMode(mode)
                setMoveId(id)
                setMoveIdx(idx)
                Animated.timing(aniMv, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.ease)
                }).start(() => {
                    Animated.timing(aniMvAr, {
                        toValue: 1,
                        duration: 300,
                        useNativeDriver: false,
                        easing: Easing.out(Easing.ease)
                    }).start();
                });
            },800)
        }
    }  

    const cancelMoveMode = () => {
        setMoveMode('none')
        setMoveId(-1)
        aniMv.setValue(0)
        aniMvAr.setValue(0)
    } 

    const moveTodo = (id : number) => {
        const todoDTO : TodoDTO = todoList.find(fd => fd.id === moveId) as TodoDTO;
        onMoveTodo(id,moveId,todoDTO)
        cancelMoveMode()
    }

    const moveRou = (id : number) => {
        const routineDTO : RoutineDTO = routineList.find(fd => fd.id === moveId) as RoutineDTO;
        onMoveRoutine(id,moveId,routineDTO)
        cancelMoveMode()
    }

    ///////////애니메이션///////////////
    const aniCal = useRef(new Animated.Value(1)).current;
    const aniWek = useRef(new Animated.Value(1)).current;
    const aniOpa = useRef(new Animated.Value(1)).current;
    const aniArr = useRef(new Animated.Value(1)).current;
    const aniIdx = useRef(new Animated.Value(0)).current;
    const aniMain = useRef(new Animated.Value(1)).current
    const anirAl = useRef(new Animated.Value(0.2)).current
    const aniuAl = useRef(new Animated.Value(0.2)).current
    const aniMv = useRef(new Animated.Value(0)).current
    const aniMvAr = useRef(new Animated.Value(0)).current

    const aniFola = (num : number) => {
        Animated.timing(aniCal, {
            toValue: num,
            duration: 500,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease)
        }).start(() => {
            setFold(true)
            Animated.timing(aniWek, {
                delay: 200,
                toValue: num,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
            Animated.timing(aniArr, {
                toValue: num,
                duration: 500,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
        });
    }

    const aniFolb = (num : number) => {
        Animated.timing(aniWek, {
            toValue: num,
            duration: 300,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease)
        }).start(() => {
            setFold(false)
            Animated.timing(aniCal, {
                toValue: num,
                duration: 500,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
            Animated.timing(aniArr, {
                toValue: num,
                duration: 500,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start();
        });
    }

    const calAni = {
        height: aniCal.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [calHeight,170, 75],
        }),
        opacity : aniCal.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [1, 0, 0],
        })
    };

    const wekAni = {
        height: aniWek.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [170, 170, 75],
        }),
        opacity : aniWek.interpolate({
            inputRange: [0, 1 ,2],
            outputRange: [0, 1, 1],
        })
    };

    const mvAni = {
        height: aniMv.interpolate({
            inputRange: [0, 1],
            outputRange: [25, 25],
        }),
    };

    const mvArAni = {
        marginLeft: aniMvAr.interpolate({
            inputRange: [0, 1],
            outputRange: [-40, 15],
        }),
    };

    useEffect(() => {
        if(openIdx !== -1) {
            Animated.timing(aniIdx, {
                toValue: 1,
                duration: 250,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()
        }
    },[openIdx])

    useEffect(() => {
        if(upAlarm) {
            Animated.timing(aniuAl, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()
        } else {
            Animated.timing(aniuAl, {
                toValue: 0.2,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()
        }
    },[upAlarm])

    useEffect(() => {
        if(routineAlarm) {
            Animated.timing(anirAl, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()
        } else {
            Animated.timing(anirAl, {
                toValue: 0.2,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start()
        }
    },[routineAlarm])

    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderRelease: (_ , gestureState) => {
            if(gestureState.dy < -50) {
                if(!open) {
                    if(fold) {
                        if(!later) {
                            setOpen(true)
                            Animated.timing(aniWek, {
                                toValue: 2,
                                duration: 500,
                                useNativeDriver: false,
                                easing: Easing.out(Easing.ease)
                            }).start(() => {});
                        }
                    } else {
                        aniFola(1)
                    }
                }

            }
            if(gestureState.dy > 50) {
                if(fold) {
                    if(open) {
                        setOpen(false)
                        Animated.timing(aniWek, {
                            toValue: 1,
                            duration: 500,
                            useNativeDriver: false,
                            easing: Easing.out(Easing.ease)
                        }).start();
                    } else {
                        aniFolb(0)
                    }
                }
            }
        },
    })

    ////////////달력 캐러셀/////////////
    const scrollRef = useRef<ScrollView>(null)

    useEffect(() => {
        const weekDates = (startDate: Date) => {
            const startOfWeek = new Date(startDate);
            startOfWeek.setHours(0, 0, 0, 0);
            const dayOfWeek = startOfWeek.getDay(); 
            const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
            startOfWeek.setDate(diff);
            const beforeDates: number[] = [];
            const currentDates: number[] = [];
            const afterDates: number[] = [];
            for (let i = 0; i < 7; i++) {
                const beforeDay = new Date(startOfWeek);
                const currentDay = new Date(startOfWeek);
                const afterDay = new Date(startOfWeek);
                beforeDay.setDate(startOfWeek.getDate() + i - 7);
                currentDay.setDate(startOfWeek.getDate() + i);
                afterDay.setDate(startOfWeek.getDate() + i + 7);
                beforeDates.push(beforeDay.getDate());
                currentDates.push(currentDay.getDate());
                afterDates.push(afterDay.getDate());
            }
      
            return [beforeDates,currentDates,afterDates];
        };
    
        const newWeek = weekDates(date);
        setWeek(newWeek);
        setTimeout(() => {
            if (scrollRef.current) {
                scrollRef.current.scrollTo({ y: 50, animated: false });
            }
            requestAnimationFrame(() => {
                Animated.timing(aniOpa, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: false,
                    easing: Easing.out(Easing.ease)
                }).start()
            })
        },100)

        setTodoDTO(item => {
            return {...item,date : date} 
        })

        Animated.timing(aniMain, {
            toValue: 1,
            duration: 700,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease)
        }).start()

        cancelMoveMode()
        setOpenIdx(-1)
        aniIdx.setValue(0);
    },[date,fold,alarm])

    const pageChange = (event:any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        if(offsetY < 45) {
            aniMain.setValue(0)
            Animated.timing(aniOpa, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start(() => {
                setDate(item => {
                    const newDate : Date = new Date(item);
                    newDate.setDate(item.getDate() - 7);
                    if(later) {
                        onLater(newDate)
                        onSetLater(false)
                        onSetLatId(-1)
                    }
                    return newDate;
                });
            })
        } 
        if (offsetY > 55) {
            aniMain.setValue(0)
            Animated.timing(aniOpa, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start(() => {
                setDate(item => {
                    const newDate : Date = new Date(item);
                    newDate.setDate(item.getDate() + 7);
                    if(later) {
                        onLater(newDate)
                        onSetLater(false)
                        onSetLatId(-1)
                    }
                    return newDate;
                });
            })
        }
    };
    /////////////////알림////////////////
    const [currentHour,setCurrentHour] = useState<number>(-1)
    const [currentMinute,setCurrentMinute] = useState<number>(-1)

    const hourRef = useRef<ScrollView>(null)
    const minuteRef = useRef<ScrollView>(null)

    let hour : number [] = []
    hour.push(24)
    for(let i : number = 0; i < 24; i++) {
        hour.push(i)
    }
    hour.push(24)

    let minute : number [] = []
    minute.push(60)
    for(let i : number = 0; i < 60; i++) {
        minute.push(i)
    }
    minute.push(60)

    const hourChange = (event:any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const hourIndex = Math.round(offsetY / event.nativeEvent.layoutMeasurement.height) + 1;

        if (offsetY >= 980) {
            requestAnimationFrame(() => { 
                if(hourRef.current) {
                    hourRef.current.scrollTo({ y: 40 , animated: true })
                }
            })
            setCurrentHour(0);
        } else if (offsetY <= 20) {
            requestAnimationFrame(() => { 
                if(hourRef.current) {
                    hourRef.current.scrollTo({ y: 960 , animated: true })
                }
            })
            setCurrentHour(23);
        } else setCurrentHour(hourIndex-2);
    }

    const minuteChange = (event:any) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const minuteIndex = Math.round(offsetY / event.nativeEvent.layoutMeasurement.height) + 1;
        setCurrentMinute(minuteIndex);
        if (offsetY >= 2420) {
            requestAnimationFrame(() => { 
                if(minuteRef.current) {
                    minuteRef.current.scrollTo({ y: 40 , animated: true })
                }
                if(currentHour < 23 && hourRef.current) {
                    hourRef.current.scrollTo({ y: 40 * ( currentHour + 2 ) , animated: true })
                    setCurrentHour(currentHour + 1)
                }
            })
            setCurrentMinute(0);
        } else if (offsetY <= 20) {
            requestAnimationFrame(() => { 
                if(minuteRef.current) {
                    minuteRef.current.scrollTo({ y: 2400 , animated: true })
                }
                if(currentHour > 0 && hourRef.current) {
                    hourRef.current.scrollTo({ y: 40 * currentHour , animated: true })
                    setCurrentHour(currentHour - 1)
                }
            })
            setCurrentMinute(59);
        } else setCurrentMinute(minuteIndex-2);
    }

    const onAlarmModal = (id : number) => {
        setAlarm(true)
        setAlarmId(id)
        const now : Date = new Date()
        setCurrentHour(now.getHours())
        setCurrentMinute(now.getMinutes())
        requestAnimationFrame(() => {
            if(hourRef.current) {
                hourRef.current.scrollTo({ y: 40 * ( now.getHours() + 1 ) , animated: true })
            }
            if(minuteRef.current) {
                minuteRef.current.scrollTo({ y: 40 * ( now.getMinutes() + 1 ) , animated: true })
            }
        })
    }

    const onAlarm = () => {
        const newDate : Date = date

        newDate.setHours(currentHour)
        newDate.setMinutes(currentMinute)
        newDate.setSeconds(0)
        
        onTodoAlarm(alarmId,newDate)
        
        setAlarm(false)
        setAlarmId(-1)
        setCurrentHour(-1)
        setCurrentMinute(-1)
    }
    ///////////////////////////////////////////
    const onDTO = () => {
        Keyboard.dismiss()

        mainRef.current?.scrollTo({ y: contentHeight, animated: true });

        onTodoDTO(todoDTO)

        setTodoDTO({
            id : -1,
            date : date,
            content : '',
            success :false,
            alarm : false,
            alarmDate : new Date(),
            time : ''
        })
    }

    const onCheck = (id : number) => {
        onTodoCheck(id)
        onCancelAlarm(id)
    }

    const onRouCheck = (id : number) => {
        onRoutineCheck(id,date)
    }

    const onLater = (dt : Date) => {
        onMove(dt,latId)
        onCancelAlarm(latId)
    }

    const onWeek = (i : number) => {
        aniMain.setValue(0)
        setDate(item => {
            const newDate : Date = new Date(item)
            if(item.getDate() < 7) {
                if(item.getDate() - i > 21) {
                    newDate.setMonth(item.getMonth() - 1)
                }
            }
            newDate.setDate(item.getDate() - i)
            if(item.getDate() > 21) {
                if(item.getDate() - i < 7) {
                    newDate.setMonth(item.getMonth() + 1)
                }
            }
            if(later) {
                onLater(newDate)
                onSetLater(false)
                onSetLatId(-1)
            }
            return newDate
        });
    }

    const onOpenIndex = (idx : number) => {
        setAning(true)
        Animated.timing(aniIdx, {
            toValue: 0,
            duration: 250,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease)
        }).start(() => {
            setOpenIdx(idx)
            setAning(false)
        })
    }

    const calendarHeader = (date : Date) => {
        const year = date.getFullYear();
        return (
        <Pressable
            onPress={() => {
                aniMain.setValue(0)
                setCalendarVisible(false)
                setDate(new Date())
                requestAnimationFrame(() => {
                    setCalendarVisible(true)
                })
            }}>
            <Text style={{fontSize:22,fontWeight:'bold',color: globalFont}}>{year}년 {(date.getMonth() + 1).toString().padStart(2, '0')}월</Text>
        </Pressable>
    )}

    const onRouWeek = (num : number) => {
        setRouWeek(rowk => rowk.map((item,index) => {
            if(index === num) {
                return !item
            } else {
                return item
            }
        }))
    }

    const onRoutineModal = (id : number) => {
        onRouWeek(date.getDay())
        setRoutine(true)
        setRouId(id)
        const now : Date = new Date()
        setCurrentHour(now.getHours())
        setCurrentMinute(now.getMinutes())
        requestAnimationFrame(() => {
            if(hourRef.current) {
                hourRef.current.scrollTo({ y: 40 * ( now.getHours() + 1 ) , animated: true })
            }
            if(minuteRef.current) {
                minuteRef.current.scrollTo({ y: 40 * ( now.getMinutes() + 1 ) , animated: true })
            }
        })
    }

    const closeRoutineModal = () => {
        setRouWeek([false,false,false,false,false,false,false])
        setRoutine(false)
        setRouId(-1)
        setRoutineAlarm(false)
        setCurrentHour(-1)
        setCurrentMinute(-1)
    }

    const onRoutine = () => {
        const dateDTO : TodoDTO | undefined = todoList.find(fd => fd.id === rouId);

        const newDate : Date = date

        newDate.setHours(currentHour)
        newDate.setMinutes(currentMinute)
        newDate.setSeconds(0)

        if(dateDTO) {
            const startDate = dateToInt(date) < dateToInt(new Date()) ? new Date() : date;
            if(dateToInt(date) < dateToInt(new Date())) {
                if(!rouWeek[new Date().getDay()]) {
                    for(let i = 0;i < 7;i++) {
                        if( i + new Date().getDay() < 7) {
                            if(rouWeek[i+new Date().getDay()]) {
                                startDate.setDate( startDate.getDate() + i )
                                break;
                            }
                        } else {
                            if(rouWeek[i+new Date().getDay()-7]) {
                                startDate.setDate( startDate.getDate() + i )
                                break;
                            }
                        }
                    }
                }
            } else {
                if(!rouWeek[date.getDay()]) {
                    for(let i = 0;i < 7;i++) {
                        if( i + date.getDay() < 7) {
                            if(rouWeek[i+date.getDay()]) {
                                startDate.setDate( startDate.getDate() + i)
                                break;
                            }
                        } else {
                            if(rouWeek[i+date.getDay()-7]) {
                                startDate.setDate( startDate.getDate() + i )
                                break;
                            }
                        }
                    }
                }
            }
            const routineDTO : RoutineDTO = {
                id : routineId,
                content : dateDTO.content,
                end : false,
                startDate : startDate,
                endDate : new Date(),
                term : rouWeek,
                success : [],
                alarm : routineAlarm,
                alarmDate : newDate,
                time : '',
            }
            onTodoDelete(rouId)
            onRoutineDTO(routineDTO)
        }
        if(!week[1].includes(date.getDate())) {
            aniMain.setValue(0)
            Animated.timing(aniOpa, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
                easing: Easing.out(Easing.ease)
            }).start(() => {
                setDate(item => {
                    const newDate : Date = new Date(item);
                    newDate.setDate(item.getDate());
                    if(later) {
                        onLater(newDate)
                        onSetLater(false)
                        onSetLatId(-1)
                    }
                    return newDate;
                });
            })
        }
        setOpenIdx(-1)
        aniIdx.setValue(0);
        closeRoutineModal()
    }
    
    const onUpWeek = (num : number) => {
        setUpWeek(rowk => rowk.map((item,index) => {
            if(index === num) {
                return !item
            } else {
                return item
            }
        }))
    }

    const onUpModal = (id : number,term : boolean[],rouAl : boolean, rouEnd : boolean, hour: number, minute: number) => {
        setUpId(id)
        setUpWeek(term)
        setUpModal(true)
        setUpAlarm(rouAl)
        setUpState(rouEnd)
        setCurrentHour(hour)
        setCurrentMinute(minute)
        requestAnimationFrame(() => {
            if(hourRef.current) {
                hourRef.current.scrollTo({ y: 40 * ( hour + 1 ) , animated: true })
            }
            if(minuteRef.current) {
                minuteRef.current.scrollTo({ y: 40 * ( minute + 1 ) , animated: true })
            }
        })
    }

    const closeUpModal = () => {
        setUpModal(false)
        setUpAlarm(false)
        setUpId(-1)
        setCurrentHour(-1)
        setCurrentMinute(-1)
    }

    const onDeleteRoutine = () => {
        closeUpModal()
        onRoutineEnd(upId,date)
    } 

    const onReRoutine = () => {
        setUpState(false)
        onRoutineRe(upId)
        requestAnimationFrame(() => {
            if(hourRef.current) {
                hourRef.current.scrollTo({ y: 40 * ( currentHour + 1 ) , animated: true })
            }
            if(minuteRef.current) {
                minuteRef.current.scrollTo({ y: 40 * ( currentMinute + 1 ) , animated: true })
            }
        })
    }

    const onUpRoutine = () => {
        const newDate : Date = date

        newDate.setHours(currentHour)
        newDate.setMinutes(currentMinute)
        newDate.setSeconds(0)

        onRoutineUpdate(upId,upAlarm,newDate,upWeek)
        
        closeUpModal()
    }

    const closeConfirm = () => {
        setModalConfirm({
            active : false,
            type : null,
            id : -1,
            title : '',
            message : ''
        })
    }

    useEffect(() => {
        setOpenIdx(-1)
        aniIdx.setValue(0);
        if(!upTodoKey) {
            onTodoUpdateContent(upTodoId,upTodoContent)
            setUpTodoContent('')
            setUpTodoId(-1)
        }
    },[upTodoKey])

    useEffect(() => {
        setOpenIdx(-1)
        aniIdx.setValue(0);
        if(!upRouKey) {
            onRoutineUpdateContent(upRouId,upRouContent)
            setUpRouContent('')
            setUpRouId(-1)
        }
    },[upRouKey])

    useEffect(() => {
        if(!keys) {
            inputRef.current?.blur()
        } else {
            clearTimeout(pressTimeout)
        }
    },[keys])

    useEffect(() => {
        if(openIdx !== -1) {
            cancelMoveMode()
        }
    },[openIdx])

    useEffect(() => {
        aniMain.setValue(0)
        setCalendarVisible(false)
        setDate(new Date())
        requestAnimationFrame(() => {
            setCalendarVisible(true)
        })
    },[theme])

    return (
        <TouchableWithoutFeedback onPress={() => onOpenIndex(-1)} disabled={ openIdx === -1 || aning }>
        <View style={{flex:1}}>
            {!fold && 
                <Animated.View style={[calAni,{overflow:'scroll'}]}>
                    <View onLayout={onViewLayout}>
                        {calendarVisible ? <Calendar
                            style={styles.calendar}
                            current={date.toISOString().split('T')[0]}
                            renderHeader={ calendarHeader }
                            onDayPress={(day) => {
                                aniMain.setValue(0)
                                if(later) {
                                    onLater(new Date(day.dateString))
                                    onSetLater(false)
                                }
                                setDate(new Date(day.dateString))
                            }}
                            markedDates={{
                                [date.toISOString().split('T')[0]]: { selected: true, selectedColor: 'darkgray' },
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
                        /> : <View style={{height:calHeight}}/>}
                    </View>
                </Animated.View>
            }
            {fold &&
            <Animated.View style={[wekAni,{overflow:'hidden'}]}>
                <View style={{height: 170}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
                        <Pressable
                            disabled={dateToInt(date) === dateToInt(new Date())}
                            style={{flexDirection:'row'}}
                            onPress={() => {
                                aniMain.setValue(0)
                                setDate(new Date())
                            }}>
                            <Text style={[styles.topDay,{color:globalFont}]}>{`${(date.getMonth()+1).toString().padStart(2, '0')}월 ${(date.getDate()).toString().padStart(2, '0')}일 ${date.getDay() === 0 ? '일' : date.getDay() === 1 ? '월' : 
                                date.getDay() === 2 ? '화' : date.getDay() === 3 ? '수' : date.getDay() === 4 ? '목' : date.getDay() === 5 ? '금' : '토'}요일`}
                            </Text>
                            {dateToInt(date) === dateToInt(new Date()) && 
                                <Text style={[{color:"white"},styles.dayItem]}>오늘</Text> 
                            }    
                            {dateToInt(date) === (dateToInt(new Date())) - 86400000 && 
                                <Text style={[{color:"white"},styles.dayItem]}>어제</Text> 
                            }    
                            {dateToInt(date) === (dateToInt(new Date())) + 86400000 && 
                                <Text style={[{color:"white"},styles.dayItem]}>내일</Text> 
                            }    
                        </Pressable>
                        {dateToInt(date) <= (dateToInt(new Date())) && <Pressable
                            onPress={() => onAttain(date)}
                            style={{flexDirection:'row',alignItems:'center',marginRight:20}}
                        >
                            <Text style={{color:globalFont,fontSize:17}}>확인</Text>
                            <Image source={ theme === "white" ? require(  '../../assets/image/arrow-black.png') : require(  '../../assets/image/arrow-white.png')} 
                            style={{width:15,height:15,marginTop:5,transform:[{rotate : '90deg'}]}}/>
                        </Pressable>}
                    </View>
                    <View style={{flexDirection:'row',justifyContent:'space-around',marginHorizontal:10}}>
                        <Text style={{color:globalFont}}>월</Text>
                        <Text style={{color:globalFont}}>화</Text>
                        <Text style={{color:globalFont}}>수</Text>
                        <Text style={{color:globalFont}}>목</Text>
                        <Text style={{color:globalFont}}>금</Text>
                        <Text style={{color:'#2E8DFF'}}>토</Text>
                        <Text style={{color:'tomato'}}>일</Text>
                    </View>
                    <View style={styles.calBox}>
                        <ScrollView
                            ref={ scrollRef }
                            pagingEnabled
                            contentContainerStyle={{width: `100%` ,height: 150}}
                            scrollEventThrottle={50}
                            decelerationRate="fast"
                            onMomentumScrollEnd={pageChange}
                            showsVerticalScrollIndicator={false}
                        >
                            <Animated.View style={{flex: 1,flexDirection:'column',opacity:aniOpa}}>
                                {week.map((wk,index) => <View key={`${wk}_${index}`} style={{flexDirection:'row',justifyContent:'space-between'}}>
                                    {wk.map((item,index)=><Pressable 
                                        key={`${item}_${index}`}
                                        disabled={ date.getDate() === item }
                                        onPress={ () => onWeek(date.getDate() - item) }
                                        style={{width:'14.3%',height:50,justifyContent:'center',alignItems:'center'}}>
                                        <Text style={[styles.calTxt,{backgroundColor: date.getDate() === item ? 'darkgray' : globalBack, 
                                            color: date.getDate() === item ? 'white' : index === 5 ? '#2E8DFF' : index === 6 ? 'tomato' : globalFont, width:40,height:40,
                                            borderRadius:20,textAlignVertical:'center',textAlign:'center'}]}>{item}</Text>
                                    </Pressable>)}
                                </View>)}
                            </Animated.View>
                        </ScrollView>
                    </View>
                </View>
            </Animated.View>}
            {/* {!open && <Pressable 
                onPress={() => fold ? aniFolb(0) : aniFola(1)}
                style={{alignItems:'center',paddingBottom:5}}>
                <Animated.Image source={ require('../../assets/image/arrow-black.png')} 
                    style={{width:40,height:40,
                        opacity: aniWek.interpolate({ inputRange: [0, 1, 2], outputRange: [1, 1, 0] }),
                        transform:[{rotate : aniArr.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] })}]}}/>
            </Pressable>} */}
            {later && 
            <View style={{flex:1,elevation:20,backgroundColor:globalBack,borderTopRightRadius:20,borderTopLeftRadius:20}}>
                <View {...panResponder.panHandlers} style={{height:35,paddingTop:1}}>
                    <Image style={{width:32,height:32,alignSelf:'center'}} source={require(  '../../assets/image/drag.png')}/>
                </View>
                <Pressable
                    onPress={() => onSetLater(false)}
                    style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                    <Text style={{color:globalFont,fontSize: 17}}>계획 이동</Text>
                    <Text style={{color:globalFont,fontSize: 17}}>이동할 날짜를 선택하세요</Text>
                </Pressable>
            </View>}
            {!later && <View style={{flex:1,elevation:20,backgroundColor:globalBack,borderTopRightRadius:20,borderTopLeftRadius:20}}>
                <View {...panResponder.panHandlers} style={{height:35,paddingTop:1}}>
                    <Image style={{width:32,height:32,alignSelf:'center'}} source={require(  '../../assets/image/drag.png')}/>
                </View>
                <Animated.ScrollView
                    ref={mainRef}
                    style={{opacity: aniMain}}
                    onContentSizeChange={(_, height) => setContentHeight(height)}
                    showsVerticalScrollIndicator={false}>
                    <View>
                        {routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()]).length === 0 && 
                            todoList.filter(todo => dateToInt(todo.date) === dateToInt(date)).length === 0 && <Text style={{textAlign:'center',fontSize:15,marginTop:10,color:'darkgray'}}>계획을 등록해주세요</Text> }
                        {routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()]).length > 0 && 
                            <Text style={[styles.h2,{color:globalFont}]}>루틴</Text>}
                        {moveMode === 'routine' && routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()]).length > 0 &&
                            <Pressable
                                onPress={() => moveRou(-1)}
                            >
                                <Animated.View
                                    style={[mvAni,{marginTop:7,opacity:aniMv,backgroundColor:theme === "white" ? 'whitesmoke' : '#333333',flexDirection:'row',alignItems:'center',overflow:'hidden'}]}
                                >
                                    <Animated.Image 
                                            source={require('../../assets/image/arrow-black.png')} 
                                            style={[mvArAni,{width:20,height:20,transform:[{rotate : '90deg'}]}]}/>
                                </Animated.View>
                            </Pressable>
                        }
                        {routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()])
                            .map((item,index) => 
                            (moveMode !== 'routine' || index !== moveIdx) &&
                            <View key={`${item}_${index}`} style={{flexDirection:'column'}}>
                                <View style={[styles.rouItem,{borderBottomWidth : moveMode === 'routine' ? 0 : 1}]}>
                                    <Pressable onPress={ () => onRouCheck(item.id) }>
                                        <Image source={ item.success.findIndex(item => dateToInt(item) === dateToInt(date)) !== -1 ? 
                                            require(  '../../assets/image/check.png') : require(  '../../assets/image/check_null.png')} 
                                            style={styles.checkImg}/>
                                    </Pressable>
                                    <View style={styles.goalContent}>
                                        <View style={{flexDirection:'row',gap: 8}}>
                                            { item.alarm &&<Text style={styles.alTxt}>
                                                {item.alarmDate.getHours().toString().padStart(2, '0')} : {item.alarmDate.getMinutes().toString().padStart(2, '0')}
                                            </Text>}
                                            <Text style={[styles.alTxt,{backgroundColor:'#2E8DFF'}]}>START D+{ -(dateToInt(item.startDate) - dateToInt(date))/86400000 }</Text>
                                            { item.end && 
                                                <Text style={[styles.alTxt,{backgroundColor:'tomato'}]}>END D-{ (dateToInt(item.endDate) - dateToInt(date))/86400000 }</Text>
                                            }
                                        </View>
                                        { dateToInt(date) >= dateToInt(new Date()) ?
                                        <TextInput
                                            ref={inputRef}
                                            multiline
                                            onPressIn={() => !upRouKey && onMoveMode(item.id,index,'routine')}
                                            onPressOut={() => clearTimeout(pressTimeout)}
                                            editable={moveMode === 'none'}
                                            onFocus={() => {
                                                requestAnimationFrame(() => {
                                                    setUpRouId(item.id)
                                                    setUpRouKey(true)
                                                    setUpRouContent(item.content)
                                                })
                                            }}
                                            onBlur={() => {
                                                setUpRouKey(false)
                                            }}
                                            onChangeText={(text) => {setUpRouContent(text)}}
                                            style={{textDecorationLine:  item.success.findIndex(item => dateToInt(item) === dateToInt(date)) 
                                            !== -1 ? 'line-through' : 'none',color: item.success.findIndex(item => dateToInt(item) === dateToInt(date)) 
                                            !== -1 ? 'darkgray' : globalFont,fontSize:16, padding:0}}
                                        >
                                        {item.content}
                                        </TextInput> :
                                        <Text style={{textDecorationLine:  item.success.findIndex(item => dateToInt(item) === dateToInt(date)) 
                                            !== -1 ? 'line-through' : 'none',color: item.success.findIndex(item => dateToInt(item) === dateToInt(date)) 
                                            !== -1 ? 'darkgray' : globalFont,fontSize:16}}>
                                            {item.content}
                                        </Text>}
                                    </View>
                                    { dateToInt(date) >= dateToInt(new Date()) && 
                                    <View style={styles.buttonBox}>
                                        <Pressable
                                            onPress={() => {
                                                cancelMoveMode()
                                                onUpModal(item.id,item.term,item.alarm,item.end,
                                                item.alarm ? new Date(item.alarmDate).getHours() : new Date().getHours(),
                                                item.alarm ? new Date(item.alarmDate).getMinutes() : new Date().getMinutes())}}>
                                            <Image source={ require(  '../../assets/image/setting.png') } 
                                            style={{width:30,height:30,marginHorizontal:3}}/>
                                        </Pressable>
                                    </View>}
                                </View>
                                {moveMode === 'routine' && index !== moveIdx &&
                                    <Pressable
                                        onPress={() => moveRou(item.id)}
                                    >
                                        <Animated.View
                                            style={[mvAni,{opacity:aniMv,backgroundColor:theme === "white" ? 'whitesmoke' : '#333333',flexDirection:'row',alignItems:'center',overflow:'hidden'}]}
                                        >
                                            <Animated.Image 
                                                source={require('../../assets/image/arrow-black.png')} 
                                                style={[mvArAni,{width:20,height:20,transform:[{rotate : '90deg'}]}]}/>
                                        </Animated.View>
                                    </Pressable>
                                }
                            </View>)}
                        </View>
                        <View>
                            {todoList.filter(todo => dateToInt(todo.date) === dateToInt(date)).length > 0 && <Text style={[styles.h2,{color:globalFont,marginTop:
                            routineList.filter(rou => dateToInt(new Date(rou.startDate)) <= dateToInt(date) && 
                            (rou.end ? dateToInt(rou.endDate) > dateToInt(date) : true) && rou.term[date.getDay()]).length > 0 ? 15 : 0}]}>계획</Text>}
                            {moveMode === 'todo' && todoList.filter(todo => dateToInt(todo.date) === dateToInt(date)).length > 0 &&
                                <Pressable
                                    onPress={() => moveTodo(-1)}
                                >
                                    <Animated.View
                                        style={[mvAni,{opacity:aniMv,marginTop:7,backgroundColor:theme === "white" ? 'whitesmoke' : '#333333',flexDirection:'row',alignItems:'center',overflow:'hidden'}]}
                                    >
                                        <Animated.Image 
                                                source={require('../../assets/image/arrow-black.png')} 
                                                style={[mvArAni,{width:20,height:20,transform:[{rotate : '90deg'}]}]}/>
                                    </Animated.View>
                                </Pressable>
                            }
                            {todoList.filter(todo => dateToInt(todo.date) === dateToInt(date)).map((item,index) => 
                                <View key={`${item}_${index}`}>
                                    {(moveMode !== 'todo' || index !== moveIdx) && <View style={[styles.goalItem,{borderBottomWidth : moveMode === 'todo' ? 0 : 1}]}>      
                                        <Pressable onPress={ () => onCheck(item.id) }>
                                            <Image source={ item.success ? require(  '../../assets/image/check.png') : 
                                                require(  '../../assets/image/check_null.png')} 
                                                style={styles.checkImg}/>
                                        </Pressable>
                                        <View style={styles.goalContent}>
                                            {item.date > new Date(new Date().setHours(0, 0, 0, 0)) && item.alarm && <View style={{flexDirection:'row'}}><Text style={styles.alTxt}>
                                                {item.alarmDate.getHours().toString().padStart(2, '0')} : {item.alarmDate.getMinutes().toString().padStart(2, '0')}
                                            </Text></View>}
                                            { !item.success ? 
                                            <TextInput 
                                                multiline
                                                onPressIn={() => !upTodoKey && onMoveMode(item.id,index,'todo')}
                                                onPressOut={() => clearTimeout(pressTimeout)}
                                                editable={moveMode === 'none'}
                                                ref={inputRef}
                                                onFocus={() => {
                                                    requestAnimationFrame(() => {
                                                        setUpTodoId(item.id)
                                                        setUpTodoKey(true)
                                                        setUpTodoContent(item.content)
                                                    })
                                                }}
                                                onBlur={() => {
                                                    setUpTodoKey(false)
                                                }}
                                                onChangeText={(text) => {setUpTodoContent(text)}}
                                                style={{color: item.success ? 'darkgray' : globalFont,fontSize:16,padding:0}}>
                                                {item.content}
                                            </TextInput> : 
                                            <Pressable
                                                onPressIn={() => !upTodoKey && onMoveMode(item.id,index,'todo')}
                                                onPressOut={() => clearTimeout(pressTimeout)}
                                            >
                                                <Text
                                                    style={{textDecorationLine: 'line-through', color: 'darkgray' ,fontSize:16}}>
                                                    {item.content}
                                                </Text>
                                            </Pressable>
                                            }
                                        </View>
                                        <View style={styles.buttonBox}>
                                            <Pressable
                                                onPress={() => {
                                                    cancelMoveMode()
                                                    setModalConfirm({
                                                        active : true,
                                                        type : 'todo',
                                                        id : item.id,
                                                        title : '계획 삭제',
                                                        message : '계획를 삭제하시겠습니까?',
                                                        subMessage : '※삭제된 계획은 복구할 수 없습니다.'
                                                    })}}>
                                                <Image source={ require(  '../../assets/image/delete-black.png') } 
                                                style={{width:30,height:30,marginHorizontal:3}}/>
                                            </Pressable>
                                            <Pressable 
                                                disabled={index === openIdx}
                                                onPress={() => openIdx === -1 ? setOpenIdx(index) : onOpenIndex(index)}>
                                                {!item.success ? <Animated.View
                                                    style={[styles.botButBox,
                                                    {width: index === openIdx ? aniIdx.interpolate({ inputRange: [0, 1], outputRange: [37, 101]  }) : 37,
                                                    marginLeft: index === openIdx ? aniIdx.interpolate({ inputRange: [0, 1], outputRange: [0, -62]  }) : 0,
                                                    backgroundColor: theme === "white" ? "white" : "#363636"}]}>
                                                    <Pressable
                                                        onPress={() => item.alarm ? onCancelAlarm(item.id) : onAlarmModal(item.id) }
                                                        disabled={index !== openIdx || item.date < new Date(new Date().setHours(0, 0, 0, 0))}>
                                                        <Image source={ item.date < new Date(new Date().setHours(0, 0, 0, 0)) ? require(  '../../assets/image/clock.png') : 
                                                            item.alarm ? require(  '../../assets/image/clock_on.png') : require(  '../../assets/image/clock.png') } 
                                                        style={[styles.rightImg,{opacity: item.date < new Date(new Date().setHours(0, 0, 0, 0)) ? 0.3 : 1 }]}/>
                                                    </Pressable>
                                                    <Pressable
                                                        onPress={() => onRoutineModal(item.id)}
                                                        disabled={index !== openIdx}>
                                                        <Image source={ require(  '../../assets/image/upgrade.png') } 
                                                        style={styles.rightImg}/>
                                                    </Pressable>
                                                    <Pressable 
                                                        onPress={() => {
                                                            onSetLater(true)
                                                            onSetLatId(item.id)
                                                            if(fold && open) {
                                                                setOpen(false)
                                                                Animated.timing(aniWek, {
                                                                    toValue: 1,
                                                                    duration: 500,
                                                                    useNativeDriver: false,
                                                                    easing: Easing.out(Easing.ease)
                                                                }).start();
                                                            }
                                                        }}
                                                        disabled={index !== openIdx}>
                                                        <Image source={ require(  '../../assets/image/later.png') } 
                                                        style={styles.rightImg}/>
                                                    </Pressable>
                                                </Animated.View> : <View style={{height:35}}/>}
                                            </Pressable>
                                        </View>
                                    </View>}
                                    {moveMode === 'todo' && index !== moveIdx &&
                                        <Pressable
                                            onPress={() => moveTodo(item.id)}
                                        >
                                            <Animated.View
                                                style={[mvAni,{opacity:aniMv,marginTop:7,backgroundColor:theme === "white" ? 'whitesmoke' : '#333333',flexDirection:'row',alignItems:'center',overflow:'hidden'}]}
                                            >
                                                <Animated.Image 
                                                    source={require('../../assets/image/arrow-black.png')} 
                                                    style={[mvArAni,{width:20,height:20,transform:[{rotate : '90deg'}]}]}/>
                                            </Animated.View>
                                        </Pressable>
                                    }
                                </View>
                            )}
                        </View>
                    
                    <View style={{paddingBottom: (!upTodoKey && !upRouKey && !keys) ? 85 : 10}}/>
                </Animated.ScrollView>
            </View>}
            {!later && !upTodoKey && !upRouKey && moveMode === 'none' &&
            <View style={{flex:0, backgroundColor: keys ? globalBack : '#00000000',position:keys ? 'relative' : 'absolute',bottom:0}}>
                <View style={[styles.contentBox,{opacity: keys ? 1 : 0.8, backgroundColor : theme === "white" ? "white" : "#333333"}]}>
                    <TextInput 
                        ref={inputRef}
                        value={todoDTO.content} 
                        multiline
                        style={[styles.contentInput,{color:globalFont}]}
                        placeholder='계획 입력'
                        placeholderTextColor="gray"
                        onChangeText={(text) => 
                            setTodoDTO(item => {
                            return {...item,content : text} 
                    })}/>
                    <Pressable onPress={ () => todoDTO.content.length > 0 && onDTO() }>
                        <Image source={require('../../assets/image/schedule_add.png')} style={[styles.scheduleImg,
                            {opacity: todoDTO.content.length > 0 ? 1 : 0.3 }]}/>
                    </Pressable>
                </View>
            </View>}
            {moveMode !== 'none' && 
            <Pressable
                onPress={cancelMoveMode}
                style={[styles.contentBox,{position:'absolute',opacity:0.8, backgroundColor : theme === "white" ? "white" : "#333333"}]}
            >  
                <Animated.Text numberOfLines={1} ellipsizeMode="tail" style={[styles.moveContent,{color:globalFont,opacity:aniMv}]}>
                    { moveMode === 'todo' ? todoList.find(item => item.id === moveId)?.content : moveMode === 'routine' && routineList.find(item => item.id === moveId)?.content }
                </Animated.Text> 
            </Pressable>}
            <Modal
                animationType="fade"
                transparent={true}
                visible={routine}
            >
            <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                <View style={[styles.modal,{backgroundColor: globalBack}]}>
                    <Text style={[styles.modalTitle,{color:globalFont}]}>루틴 등록</Text>
                    <View style={{flexDirection:'row',width: '100%', justifyContent:'space-evenly',marginTop:20}}>
                        <Pressable
                            onPress={() => onRouWeek(1)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[1] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[1] ? 'white' : 'black'}]}>월</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(2)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[2] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[2] ? 'white' : 'black'}]}>화</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(3)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[3] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[3] ? 'white' : 'black'}]}>수</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(4)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[4] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[4] ? 'white' : 'black'}]}>목</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(5)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[5] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[5] ? 'white' : 'black'}]}>금</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(6)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[6] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[6] ? 'white' : '#2E8DFF'}]}>토</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onRouWeek(0)}>
                            <Text style={[styles.rouTxt,{backgroundColor: rouWeek[0] ? 'darkgray' : 'whitesmoke' , 
                                    color: rouWeek[0] ? 'white' : 'tomato'}]}>일</Text>
                        </Pressable>
                    </View>
                    <View style={{flexDirection:'row',marginTop:20,justifyContent:'center',gap:25}}>
                            <View style={{flexDirection:'row',gap:1,alignItems:'center'}}>
                                <Text style={[styles.time,{color:globalFont,fontSize:20, marginBottom:4.5}]}>알림</Text>
                                <Switch
                                    trackColor={{false: 'darkgray', true: '#2E8DFF'}}
                                    thumbColor={theme === "white" ? 'white' : '#232323'}
                                    onValueChange={() => setRoutineAlarm(!routineAlarm)}
                                    value={routineAlarm}
                                />
                            </View>
                            <Animated.View style={[styles.alarm,{opacity: anirAl}]}>
                                <View style={{width:50,height:40}}>
                                    <ScrollView
                                        ref={ hourRef }
                                        pagingEnabled
                                        scrollEnabled={routineAlarm}
                                        onMomentumScrollEnd={hourChange}
                                        contentContainerStyle={{width: `100%` ,height: 1040}}
                                        scrollEventThrottle={50}
                                        decelerationRate="normal"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {hour.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                            <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                                    </ScrollView>
                                </View>
                                    <Text style={{fontSize:23,fontWeight:'bold',textAlignVertical:'center',color:globalFont}}>:</Text>
                                <View style={{width:50,height:40}}>    
                                    <ScrollView
                                        ref={ minuteRef }
                                        pagingEnabled
                                        scrollEnabled={routineAlarm}
                                        onMomentumScrollEnd={minuteChange}
                                        contentContainerStyle={{width: `100%` ,height: 2480}}
                                        scrollEventThrottle={50}
                                        decelerationRate="normal"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {minute.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                            <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                                    </ScrollView>
                                </View>
                            </Animated.View>
                        </View>
                    <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                        <Pressable
                            onPress={() => closeRoutineModal()}>
                                <Image source={ require(  '../../assets/image/cancel.png') } style={styles.modalBut}/>
                        </Pressable>
                        <Pressable
                            onPress={onRoutine}
                            disabled={rouWeek.filter(item => item).length === 0}
                            >
                            <Image source={ require(  '../../assets/image/add.png') } 
                                style={[styles.modalBut,{opacity:rouWeek.filter(item => item).length === 0 ? 0.3 : 1}]}/>
                        </Pressable>
                    </View>
                </View>
            </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={alarm}
            >
            <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
            <View style={[styles.modal,{backgroundColor: globalBack}]}>
                <Text style={[styles.modalTitle,{color:globalFont}]}>알림 등록</Text>
                <View style={{flexDirection:'row',justifyContent:'center',gap:20,marginTop:10}}>
                    <View style={{height:40,justifyContent:'center'}}>
                        <Text style={{color:globalFont,fontWeight: 'normal',fontSize:21}}>
                            {`${(date.getMonth()+1).toString().padStart(2, '0')}월 ${(date.getDate()).toString().padStart(2, '0')}일 ${date.getDay() === 0 ? '일' : date.getDay() === 1 ? '월' : 
                            date.getDay() === 2 ? '화' : date.getDay() === 3 ? '수' : date.getDay() === 4 ? '목' : date.getDay() === 5 ? '금' : '토'}요일`}</Text>
                    </View>
                    <View style={styles.alarm}>
                        <View style={{width:50,height:40}}>
                            <ScrollView
                                ref={ hourRef }
                                pagingEnabled
                                onMomentumScrollEnd={hourChange}
                                contentContainerStyle={{width: `100%` ,height: 1040}}
                                scrollEventThrottle={50}
                                decelerationRate="normal"
                                showsVerticalScrollIndicator={false}
                            >
                                {hour.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                    <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                            </ScrollView>
                        </View>
                            <Text style={{fontSize:23,fontWeight:'bold',textAlignVertical:'center',color:globalFont}}>:</Text>
                        <View style={{width:50,height:40}}>    
                            <ScrollView
                                ref={ minuteRef }
                                pagingEnabled
                                onMomentumScrollEnd={minuteChange}
                                contentContainerStyle={{width: `100%` ,height: 2480}}
                                scrollEventThrottle={50}
                                decelerationRate="normal"
                                showsVerticalScrollIndicator={false}
                            >
                                {minute.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                    <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                            </ScrollView>
                        </View>
                    </View>
                </View>
                    <View style={{flexDirection:'row',justifyContent:'space-evenly'}}>
                        <Pressable
                            onPress={() => {
                                setAlarm(false)
                                setAlarmId(-1)
                                setCurrentHour(-1)
                                setCurrentMinute(-1)
                            }}>
                            <Image source={ require(  '../../assets/image/cancel.png') } style={styles.modalBut}/>
                        </Pressable>
                        <Pressable
                            disabled={(dateToInt(date) === dateToInt(new Date()) && 
                                (currentHour < new Date().getHours() || (currentHour === new Date().getHours() && currentMinute <= new Date().getMinutes())))}
                            onPress={onAlarm}
                            >
                            <Image source={ require(  '../../assets/image/add.png') } style={[styles.modalBut,{opacity: 
                            (dateToInt(date) === dateToInt(new Date()) && 
                            (currentHour < new Date().getHours() || (currentHour === new Date().getHours() && currentMinute <= new Date().getMinutes()))) ? 0.3 : 1}]}/>
                        </Pressable>
                    </View>
                </View>
            </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={upModal}
            >
                <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                    {upState ? 
                        <View style={[styles.modal,{backgroundColor: globalBack}]}>
                            <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>                         
                                <Text style={[styles.modalTitle,{color:globalFont}]}>루틴 복구</Text>
                            </View>
                            <View style={{marginVertical:10}}>
                                <Text style={{color:globalFont,textAlign:'center',fontSize:18}}>종료 예정인 루틴입니다.</Text>
                                <Text style={{color:globalFont,textAlign:'center',fontSize:18}}>복구하시겠습니까?</Text>
                            </View>
                            <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                                <Pressable
                                    onPress={() => closeUpModal()}>
                                        <Image source={ require(  '../../assets/image/cancel.png') } style={styles.modalBut}/>
                                </Pressable>
                                <Pressable
                                    onPress={onReRoutine}
                                    >
                                    <Image source={ require(  '../../assets/image/check.png') } 
                                        style={styles.modalBut}/>
                                </Pressable>
                            </View>
                        </View>
                     : <View style={[styles.modal,{backgroundColor: globalBack}]}>
                        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>                         
                            <Text style={[styles.modalTitle,{color:globalFont}]}>루틴 설정</Text>
                            <Pressable
                                onPress={() => setModalConfirm({
                                    active : true,
                                    type : 'routine',
                                    id : upId,
                                    title : '루틴 종료',
                                    message : '루틴을 종료하시겠습니까?',
                                    subMessage : '※선택된 날짜를 기준으로 종료됩니다.'
                                })}
                                >
                                <Text style={{backgroundColor:'tomato', borderRadius: 5, paddingVertical: 3, paddingHorizontal: 7, color: 'white',marginRight:5,fontSize:16,fontWeight:'bold'}}>
                                    END
                                </Text>
                            </Pressable>
                        </View>
                        <View style={{flexDirection:'row',width: '100%', justifyContent:'space-evenly',marginTop:20}}>
                            <Pressable
                                onPress={() => onUpWeek(1)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[1] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[1] ? 'white' : 'black'}]}>월</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(2)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[2] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[2] ? 'white' : 'black'}]}>화</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(3)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[3] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[3] ? 'white' : 'black'}]}>수</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(4)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[4] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[4] ? 'white' : 'black'}]}>목</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(5)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[5] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[5] ? 'white' : 'black'}]}>금</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(6)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[6] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[6] ? 'white' : '#2E8DFF'}]}>토</Text>
                            </Pressable>
                            <Pressable
                                onPress={() => onUpWeek(0)}>
                                <Text style={[styles.rouTxt,{backgroundColor: upWeek[0] ? 'darkgray' : 'whitesmoke' , 
                                        color: upWeek[0] ? 'white' : 'tomato'}]}>일</Text>
                            </Pressable>
                        </View>
                        <View style={{flexDirection:'row',marginTop:20,justifyContent:'center',gap:25}}>
                            <View style={{flexDirection:'row',gap:1,alignItems:'center'}}>
                                <Text style={[styles.time,{color:globalFont,fontSize:20, marginBottom:4.5}]}>알림</Text>
                                <Switch
                                    trackColor={{false: 'darkgray', true: '#2E8DFF'}}
                                    thumbColor={theme === "white" ? 'white' : '#232323'}
                                    onValueChange={() => setUpAlarm(!upAlarm)}
                                    value={upAlarm}
                                />
                            </View>
                            <Animated.View style={[styles.alarm,{opacity: aniuAl}]}>
                                <View style={{width:50,height:40}}>
                                    <ScrollView
                                        ref={ hourRef }
                                        pagingEnabled
                                        scrollEnabled={upAlarm}
                                        onMomentumScrollEnd={hourChange}
                                        contentContainerStyle={{width: `100%` ,height: 1040}}
                                        scrollEventThrottle={50}
                                        decelerationRate="normal"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {hour.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                            <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                                    </ScrollView>
                                </View>
                                    <Text style={{fontSize:23,fontWeight:'bold',textAlignVertical:'center',color:globalFont}}>:</Text>
                                <View style={{width:50,height:40}}>    
                                    <ScrollView
                                        ref={ minuteRef }
                                        pagingEnabled
                                        scrollEnabled={upAlarm}
                                        onMomentumScrollEnd={minuteChange}
                                        contentContainerStyle={{width: `100%` ,height: 2480}}
                                        scrollEventThrottle={50}
                                        decelerationRate="normal"
                                        showsVerticalScrollIndicator={false}
                                    >
                                        {minute.map((item,index) => <View key={`${item}_${index}`} style={{height:40,justifyContent:'center'}}>
                                            <Text style={[styles.time,{color:globalFont}]}>{item.toString().padStart(2, '0')}</Text></View>)}
                                    </ScrollView>
                                </View>
                            </Animated.View>
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                            <Pressable
                                onPress={() => closeUpModal()}>
                                    <Image source={ require(  '../../assets/image/cancel.png') } style={styles.modalBut}/>
                            </Pressable>
                            <Pressable
                                onPress={onUpRoutine}
                                disabled={upWeek.filter(item => item).length === 0}
                                >
                                <Image source={ require(  '../../assets/image/check.png') } 
                                    style={[styles.modalBut,{opacity:upWeek.filter(item => item).length === 0 ? 0.3 : 1}]}/>
                            </Pressable>
                        </View>
                    </View>}
                </View>
            </Modal>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalConfirm?.active}
            >
                <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#00000010'}}>
                    <View style={[styles.modal,{backgroundColor: globalBack}]}>
                        <Text style={[styles.modalTitle,{color:globalFont}]}>{modalConfirm?.title}</Text>
                        <View style={{paddingVertical:10,paddingHorizontal:20,gap:3}}>                            
                            <Text style={{color: globalFont,fontSize:16}}>
                                {modalConfirm?.message}
                            </Text>
                            <Text style={{color: globalFont,fontSize:12}}>
                                {modalConfirm?.subMessage}
                            </Text>
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-evenly',marginTop:5}}>
                            <Pressable
                                onPress={closeConfirm}>
                                    <Image source={ require(  '../../assets/image/cancel.png') } 
                                        style={styles.modalBut}/>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    modalConfirm.type === "todo" ? onTodoDelete(modalConfirm?.id) :
                                    modalConfirm.type === "routine" && onDeleteRoutine()
                                    closeConfirm()
                                }}
                                >
                                <Image source={ require(  '../../assets/image/check.png') } 
                                    style={styles.modalBut}/>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
        </TouchableWithoutFeedback>
    );
};

const styles = StyleSheet.create({
    h2 : {
        fontSize: 22,
        fontWeight: 'bold',
        paddingLeft: 10,
        paddingBottom: 10,
    },
    calendar: {
        padding: 10,
    },
    calBox : {
        margin: 10,
        alignSelf:'center',
        height: 50,
        overflow:'hidden'
    },
    calTxt : {
        fontSize: 18,
        fontWeight: 'bold',
        color:'black'
    },
    topDay : {
        fontSize: 25,
        fontWeight: 'bold',
        margin : 20,
        marginRight : 10
    },
    contentBox : {
        elevation: 10,
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        width: '95%',
        backgroundColor:'white',
        borderRadius:5,
        bottom: 10,
        marginHorizontal: '2.5%',
        padding: 10,
    },
    contentInput : {
        fontSize: 16,
        width: windowWidth * 0.95 - 52,
        maxHeight: 118
    },
    moveContent : {
        fontSize: 16,
        marginHorizontal: 5,
        marginVertical: 13,
        
    },
    scheduleImg : {
        width:32,
        height:32,
    },
    goalItem : {
        borderBottomWidth:1,
        borderBottomColor:'gray',
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal: 5,
        paddingTop: 8,
        paddingBottom: 14,
        marginTop: 5
    },
    rouItem : {
        borderBottomWidth:1,
        borderBottomColor:'gray',
        flexDirection:'row',
        alignItems:'center',
        paddingHorizontal: 5,
        paddingVertical: 20,
    },
    goalContent : {
        width: windowWidth - 97,
        flexDirection: 'column',
        gap:1
    },
    checkImg : {
        width: 30,
        height: 30,
        marginRight: 10
    },
    buttonBox: {
        paddingHorizontal: 5
    },
    botButBox : {
        flexDirection: 'row',
        overflow: 'hidden',
        backgroundColor: 'white',
        borderColor: 'black',
        borderWidth: 2,
        width: 37,
        height: 35,
        borderRadius: 16,
        elevation: 2,
        paddingHorizontal:1
    },
    rightImg : {
        width: 25,
        height: 25,
        margin: 3
    },
    rouTxt : {
        width:34,
        height:34,
        borderRadius:17,
        textAlignVertical:'center',
        textAlign:'center',
        fontSize: 16,
        fontWeight: 'bold'
    },
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
    alarm : {
        flexDirection:'row',
        borderRadius:1,
        borderWidth:3,
        borderColor:'black',
        paddingHorizontal:1
    },
    time : {
        textAlign:'center',
        fontSize: 23,
        fontWeight: 'bold'
    },
    alTxt : {
        fontSize: 13,
        paddingHorizontal: 6,
        paddingVertical: 1,
        textAlign:'center',
        backgroundColor: 'black',
        marginBottom: 2,
        borderRadius: 5,
        color:'white'
    },
    dayItem : {
        fontSize:17,
        fontWeight:'bold',
        backgroundColor:'black',
        marginBottom:18,
        marginTop:23,
        paddingHorizontal:7,
        paddingVertical:3,
        borderRadius:10
    }
})

export default Main;
