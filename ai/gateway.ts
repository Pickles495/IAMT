import { getTopic, type TopicId } from "@/lib/domain";
/** Replace behind a server boundary when authentication, validation and budgets exist. */
export interface TutorGateway {
  respond(input: {
    text: string;
    topicId: TopicId;
  }): Promise<{ text: string; source: "demo" }>;
}
export const demoTutor: TutorGateway = {
  async respond({ text, topicId }) {
    const topic = getTopic(topicId);
    if (/例|example/i.test(text))
      return { text: `【固定デモ・具体例】${topic.example}`, source: "demo" };
    if (/条件|定義|definition/i.test(text))
      return {
        text: `【固定デモ・定義と条件】${topic.definition}`,
        source: "demo",
      };
    return {
      text: `【固定デモ応答】質問を記録しました。実AIは未接続のため、この質問への解答は生成していません。現在のBoard「${topic.label}」では、次の問いを検討できます：${topic.question} 別分野を含む自由な入力も保存できます。`,
      source: "demo",
    };
  },
};
