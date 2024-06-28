import { Alert, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RoutineDTO, TodoDTO } from "../Index";
import RNFS from 'react-native-fs';
import DocumentPicker from 'react-native-document-picker';
import { useState } from "react";

export type ModalDTO = {
    active : boolean,
    type: "import" | "importSuc" | "export" | null,
    title?: string,
    message?: string,
    buttonExist: boolean
}
interface Props {
    routineList: RoutineDTO[]
    todoList: TodoDTO[]
    globalFont: string,
    globalBack : string;
    todoId: number;
    routineId: number;
    theme : "white" | "black";
    deleteAlarm: (id : number) => void;
    addAlarm: (id : number, date : Date, content : string) => void;
    onTheme: () => void;
    onTodo: (lsit : TodoDTO[]) => void;
    onRoutine: (list : RoutineDTO[]) => void;
    onTodoId: (id : number) => void;
    onRoutineId: (id : number) => void;
    onLoading: (bool : boolean) => void; 
}

const Setting: React.FC<Props> = ({globalFont,routineList,todoList,globalBack,routineId,todoId,theme,onTheme,onTodo,onRoutine,onRoutineId,onTodoId,onLoading,deleteAlarm,addAlarm}) => {    

    const [modalConfirm,setModalConfirm] = useState<ModalDTO>({
        active : false,
        type : null,
        title : '',
        message : '',
        buttonExist : false
    })

    const closeConfirm = () => {
        setModalConfirm({
            active : false,
            type : null,
            title : '',
            message : '',
            buttonExist : false
        })
    }
    
    const fileExport = async() => { 
        try {
            const jsonData = [routineList,todoList,routineId,todoId]; // 예시 JSON 데이터
      
            const filePath = `${Platform.OS === 'ios' ? RNFS.DocumentDirectoryPath : RNFS.DownloadDirectoryPath}/facit-${Platform.OS === 'ios' ? 0 : new Date().getTime()}.json`; // 저장할 경로

            await RNFS.writeFile(filePath, JSON.stringify(jsonData), 'utf8');


            if (Platform.OS === 'ios') {
                const res : any = await DocumentPicker.pickDirectory();
                
                const destPath = `${decodeURI(res.uri)}/facit.json`;
                
                await RNFS.writeFile(destPath, JSON.stringify(jsonData), 'utf8');
                
                setModalConfirm({
                    active : true,
                    type : 'export',
                    title : '데이터 내보내기 경로',
                    message : destPath,
                    buttonExist : false
                })
            } else {
                setModalConfirm({
                    active : true,
                    type : 'export',
                    title : '데이터 내보내기 경로',
                    message : filePath,
                    buttonExist : false
                })
            }
      
          } catch (error) {
            console.log('Error saving file:', error);
          }
    }

    
    const fileImport = async () => {
        try {
            const res : any = await DocumentPicker.pickSingle({
                type: [DocumentPicker.types.json],
            });
            const filePath = res.uri ;
            onLoading(true);
            const fileData = await RNFS.readFile(filePath, 'utf8');
            const jsonData : [ RoutineDTO[], TodoDTO[], number, number ] = JSON.parse(fileData);
            todoList.map((todo) => deleteAlarm(todo.id));
            onRoutineId(jsonData[2]);
            onTodoId(jsonData[3]);
            requestAnimationFrame(() => {
                onRoutine(jsonData[0].map((routine) => {
                    routine.alarmDate = new Date(routine.alarmDate);
                    routine.startDate = new Date(routine.startDate);
                    routine.endDate = new Date(routine.endDate);
                    return routine;
                }));
                onTodo(jsonData[1].map((todo) => {
                    todo.alarmDate = new Date(todo.alarmDate);
                    todo.date = new Date(todo.date);
                    if (todo.alarm) {
                        addAlarm(todo.id, new Date(todo.alarmDate), todo.content);
                    }
                    return todo;
                }));
                setTimeout(() => onLoading(false), 1000);
                
            })
        } catch (error) {
            console.log('Error picking file:', error);
        }
    };

    const openLink = (url : string) => {
        Linking.openURL(url)
        .catch((err) => console.error('Error opening external link:', err));
    };


    return(
        <View style={{flex:1}}>
            <Text style={[styles.topTitle,{color:globalFont}]}>설정</Text>
            <ScrollView
                style={{        
                    borderTopWidth:15,
                    borderTopColor:theme === "white" ? 'whitesmoke' : '#333333',
                }}
            >
                {/* <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={()=>{}}
                >
                    <Text style={{fontSize:17,color:globalFont}}>- 알림 설정</Text>
                </Pressable> */}
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333',
                            flexDirection: 'row',
                            gap: 10,
                        }
                    ]}
                    onPress={onTheme}
                >
                    <Text style={{fontSize:17,color:globalFont}}>테마</Text>
                    <Text style={{fontSize:17,color:'darkgray'}}>{theme === 'white' ? '라이트' : '다크'} 모드</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={fileExport}
                >
                    <Text style={{fontSize:17,color:globalFont}}>데이터 내보내기</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={() => setModalConfirm({
                        active : true,
                        type : 'import',
                        title : '데이터 가져오기',
                        message : '기존 데이터를 덮어씁니다. 진행하시겠습니까?',
                        buttonExist : true
                    })}
                >
                    <Text style={{fontSize:17,color:globalFont}}>데이터 가져오기</Text>
                </Pressable>
                <Pressable
                    onPress={() => openLink('https://kr.freepik.com/')}>
                    <Text style={{textAlign:'center',fontSize:15,color:'darkgray',fontWeight:'bold',marginVertical:30}}>
                        Images Designed By FreePik</Text>
                </Pressable>
            </ScrollView>
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
                        </View>
                        <View style={{flexDirection:'row',justifyContent:'space-evenly'}}>
                            {modalConfirm.buttonExist && <Pressable
                                onPress={closeConfirm}>
                                    <Image source={ require(  '../../assets/image/cancel.png') } 
                                        style={styles.modalBut}/>
                            </Pressable>}
                            <Pressable
                                onPress={() => {
                                    closeConfirm()
                                    modalConfirm.type === 'import' && requestAnimationFrame(() => fileImport())
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
    )
}

const styles = StyleSheet.create({
    topTitle : {
        fontSize: 25,
        fontWeight: 'bold',
        margin : 15,
    },
    itemButton : {
        paddingHorizontal : 15,
        paddingVertical : 20,
        borderBottomWidth: 3,
        borderBottomColor: 'whitesmoke',
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
})
export default Setting;