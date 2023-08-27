import { OPENAIAPI } from '$/service/envValues';
import { OpenAI } from 'langchain/llms/openai';

export const runlangchain = async () => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
    modelName: 'gpt-4',
  });
  const result = await llm.predict(
    //   'ドラえもんのような文章を生成してください。ドラえもんは次のような言葉を話します。あたりまえでしょ!!お友だちだもの!!あの子がいるからぼくは生きていけるんだよ。のび太くんを選んだきみの判断は正しかったと思うよ。あったかいふとんで、ぐっすりねる！こんな楽しいことがあるか。なにかしようと思ったら、そのことだけに夢中にならなくちゃだめだ。自分の頭で考え、自分の力で切りぬけてほしい！ ぼくは、あくまでかげから見守っていてあげるからね。失敗してもいいさ！ あたたかい目で見守ってやろう！どっちも、自分が正しいと思ってるよ。 戦争なんてそんなもんだよ。すぐぼくのポケットをあてにする。 自分の力だけでやってみようと思わないの？ だから、だめなんだ。なんべんしかられてもおなじことくり返すから悪いんだ。おとなってかわいそうだね。悪いことばかり続くもんじゃないよ！ まじめに努力していれば、いつか…、夜はかならず朝となる。 長い冬がすぎれば、あたたかい春の日が…。よくみておくんだね。 きみがひるねしている間も、時間は流れつづけてる。くだらないこと気にするんじゃないよ。 男は顔じゃないぞ！ 中みだぞ!!世の中はなにかほしいと思ったら、そのためにそれなりの努力をしないといけない。へただったら、どうしてうまくなろうと努力しないんだ。'
    // );
    'ドラえもんになりきって返答してください。回答するときに相手をのび太くんと想定して'
  );
  return result;
};

// import {
//   ChatPromptTemplate,
//   HumanMessagePromptTemplate,
//   SystemMessagePromptTemplate,
// } from 'langchain/prompts';

// export const runlangchain = async () => {
//   const template =
//     'You are a helpful assistant that translates {input_people} to {output_people}.';
//   const systemMessagePrompt = SystemMessagePromptTemplate.fromTemplate(template);
//   const humanTemplate = '{text}';
//   const humanMessagePrompt = HumanMessagePromptTemplate.fromTemplate(humanTemplate);

//   const chatPrompt = ChatPromptTemplate.fromPromptMessages([
//     systemMessagePrompt,
//     humanMessagePrompt,
//   ]);

//   const formattedPrompt = await chatPrompt.formatMessages({
//     input_people: 'English',
//     output_people: 'French',
//     text: 'I love programming.',
//   });

//   return formattedPrompt;
// };
