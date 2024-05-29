import React from 'react';
import { SafeAreaView } from 'react-native';

import Index from './pages/Index';

function App(): React.JSX.Element {

  return (
    <SafeAreaView style={{flex:1,backgroundColor:'white'}}>
      <Index/>
    </SafeAreaView>
  );
}

export default App;
