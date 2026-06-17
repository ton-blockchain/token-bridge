<template>
  <div class="PermanentBanner">
    <div class="PermanentBanner-panel">
      <h2 v-if="title" class="PermanentBanner-title">{{ title }}</h2>
      <div class="PermanentBanner-message" v-html="message"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export default defineComponent({
  name: "PermanentBanner",
  props: {
    title: { type: String, required: false },
    message: { type: String, required: true },
  },
});
</script>

<style lang="less" scoped>
.PermanentBanner {
  width: 100%;
  padding: 0 20px; 
  box-sizing: border-box;
  margin-top: 16px; 
  margin-bottom: 16px; 
}

.PermanentBanner-panel {
  background-color: #fffbe6; // Light yellow background
  border-radius: var(--border_radius_default);
  border: 1px solid #ffe58f; // Matching yellow border
  padding: 12px 20px;
  width: 100%;
  max-width: 600px; 
  margin-left: auto;   
  margin-right: auto;  
  display: flex;
  flex-direction: column; // Stack title and message
  box-sizing: border-box;
}

.PermanentBanner-title {
  font-weight: bold;
  font-size: 16px; // Slightly larger for title
  margin-bottom: 8px; // Space between title and message
  text-align: center; // Center the title text
  color: #000000d9;
}

.PermanentBanner-message {
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
  white-space: pre-line;
  margin: 0;
  color: #000000d9;
  text-align: left; // Left-align the message content (bullet points)
  width: 100%; // Ensure it takes full width for left alignment to work as expected
}
</style>
