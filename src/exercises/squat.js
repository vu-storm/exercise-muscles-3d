// Squat: animation lấy sẵn từ file GLB (Mixamo "Air Squat").
export default {
  id: 'squat',
  name: 'Squat (tay không)',
  category: 'strength',
  cue: 'Chân rộng bằng hông, đẩy hông ra sau rồi hạ xuống, gối đi theo hướng mũi chân, gót không nhấc, lưng giữ thẳng.',
  source: 'glb',
  muscles: {
    primary: ['quads', 'glutes'], // không ghi .L/.R = cả hai chân
    // Đùi sau chỉ đồng co để giữ gối; cơ dép giữ cổ chân; cơ dựng sống giữ lưng thẳng.
    secondary: ['hamstrings', 'soleus', 'lowerBack'],
  },
};
