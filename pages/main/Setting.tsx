import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RoutineDTO, TodoDTO } from "../Index";


interface Props {
    routineList: RoutineDTO[]
    todoList: TodoDTO[]
    globalFont: string,
    globalBack : string;
    theme : "white" | "black";
    onTheme: () => void;
}

const Setting: React.FC<Props> = ({globalFont,routineList,todoList,globalBack,theme,onTheme}) => {
    return(
        <View style={{flex:1}}>
            <Text style={[styles.topTitle,{color:globalFont}]}>설정</Text>
            <ScrollView
                style={{        
                    borderTopWidth:15,
                    borderTopColor:theme === "white" ? 'whitesmoke' : '#333333',
                }}
            >
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={()=>{}}
                >
                    <Text style={{fontSize:20,color:globalFont}}>- 루틴 복구</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={()=>{}}
                >
                    <Text style={{fontSize:20,color:globalFont}}>- 알림 설정</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333',
                            flexDirection: 'row',
                            gap: 15,
                        }
                    ]}
                    onPress={onTheme}
                >
                    <Text style={{fontSize:20,color:globalFont}}>테마</Text>
                    <Text style={{fontSize:20,color:'darkgray'}}>{theme === 'white' ? '라이트' : '다크'} 모드</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={()=>{}}
                >
                    <Text style={{fontSize:20,color:globalFont}}>- 데이터 내보내기</Text>
                </Pressable>
                <Pressable 
                   style={({pressed})  => [styles.itemButton,
                        {
                            backgroundColor: pressed ? theme === "white" ? 'whitesmoke' : '#333333' : globalBack,
                            borderBottomColor: theme === "white" ? 'whitesmoke' : '#333333'
                        }
                    ]}
                    onPress={()=>{}}
                >
                    <Text style={{fontSize:20,color:globalFont}}>- 데이터 가져오기</Text>
                </Pressable>
            </ScrollView>
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
    }
})
export default Setting;