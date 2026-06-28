import { useState } from "react";
import { z } from "zod";
import { CopilotKit } from "@copilotkit/react-core";
import {
  useFrontendTool,
  useConfigureSuggestions,
  CopilotChat,
} from "@copilotkit/react-core/v2";

// Import the official V2 stylesheet from your PDF
import "@copilotkit/react-core/v2/styles.css";

export default function AgenticChatMultimodal() {
  return (
    // 🔗 Points directly to your local FastAPI backend port instead of Next.js routes
    <CopilotKit
      runtimeUrl="http://127.0.0"
      showDevConsole={false}
      agent="agentic_chat_multimodal"
    >
      <Chat />
    </CopilotKit>
  );
}

const Chat = () => {
  const [background, setBackground] = useState<string>("--copilot-kit-background-color");

  // Exact Frontend Tool function from Page 2 of your PDF
  useFrontendTool({
    name: "change_background",
    description:
      "Change the background color of the chat. Can be anything that the CSS background attribute accepts. Regular colors, linear or radial gradients etc.",
    parameters: z.object({
      background: z.string().describe("The background. Prefer gradients. Only use when asked."),
    }),
    handler: async ({ background }: { background: string }) => {
      setBackground(background);
      return {
        status: "success",
        message: `Background changed to ${background}`,
      };
    },
  });

  // Exact Quick Suggestion Buttons from Page 2 and 3 of your PDF
  useConfigureSuggestions({
    suggestions: [
      {
        title: "Upload an image",
        message: "Describe what you see in the image I upload.",
      },
      {
        title: "Analyze a photo",
        message: "What objects can you identify in this photo?",
      },
    ],
    available: "always",
  });

  return (
    <div
      className="flex justify-center items-center h-screen w-screen"
      data-testid="background-container"
      style={{ background }}
    >
      {/* Container matching your PDF's exact layout classes */}
      <div className="h-full w-full md:w-8/10 md:h-8/10 rounded-lg p-4">
        <CopilotChat
          agentId="agentic_chat_multimodal"
          className="h-full rounded-2xl max-w-6xl mx-auto border border-zinc-200 shadow-xl"
          attachments={{ enabled: true }} // Activates the '+' button natively
        />
      </div>
    </div>
  );
};
