import React from 'react';
import { SafeAreaView } from 'react-native';

import Index from './pages/Index';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

function App(): React.JSX.Element {

  return (
    <SafeAreaView style={{flex:1,backgroundColor:'white'}}>
      <GestureHandlerRootView>
        <Index/>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

export default App;
