<template>
  <layout>
    <router-view />
  </layout>
</template>

<script lang="ts">
import { defineComponent } from "vue";

import Layout from "@/components/Layout/index.vue";

export default defineComponent({ components: { Layout } });
</script>
