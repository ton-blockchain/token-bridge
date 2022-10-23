<template>
  <div
    class="CustomInput"
    :class="{ hasData, disabled, error: !!error && hasData, isDropdownOpened }"
  >
    <input
      :disabled="disabled"
      :readonly="hasDropdown"
      :type="type"
      :id="'CustomInput-' + $uuid.v1()"
      :inputmode="type === 'number' ? 'decimal' : 'text'"
      @input="$emit('changed')"
      @click="isDropdownOpened = true"
      @focus="isDropdownOpened = true"
      @blur="$emit('blur')"
      @focusout="onInputFocusOut"
      v-model="model"
    />
    <div class="CustomInput-labelWrapper">
      <label :for="'CustomInput-' + $uuid.v1()">{{
        (hasData && error) || label
      }}</label>
    </div>
    <div class="CustomInput-arrow" v-if="hasDropdown"></div>
    <ul class="CustomInput-dropdown" v-if="hasDropdown">
      <li v-for="(item, index) in dropdown" :key="index">
        <button @click="onOptionClick(item.value)">{{ item.label }}</button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";

export default defineComponent({
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
    error: {
      type: String,
      default: "",
    },
    label: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    modelValue: {
      type: String,
      required: true,
    },
    dropdown: {
      type: Array as PropType<{ label: string; value: string }[]>,
      default: () => [],
    },
  },

  data() {
    return {
      isDropdownOpened: false,
    };
  },

  computed: {
    hasData(): boolean {
      return !!this.modelValue;
    },
    model: {
      get(): string {
        type Item = {
          label: string;
          value: string;
        };
        if (this.hasDropdown) {
          const item: Item | undefined = (this.dropdown as Array<Item>).find(
            (item: Item) => item.value === this.modelValue
          );
          return item?.label || "";
        } else {
          return this.modelValue;
        }
      },
      set(value: string) {
        this.$emit("update:modelValue", value);
      },
    },
    hasDropdown(): boolean {
      return !!this.dropdown?.length;
    },
  },
  methods: {
    onOptionClick(value: string) {
      this.model = value;
      this.isDropdownOpened = false;
    },
    onInputFocusOut(e: FocusEvent) {
      if (!this.hasDropdown) {
        return;
      }
      let elem = e.relatedTarget as any;
      for (; elem && elem !== document; elem = elem.parentNode) {
        if (elem === this.$el) return;
      }

      this.isDropdownOpened = false;
    },
  },
});
</script>

<style lang="less" scoped>
@import "./styles.less";
</style>
