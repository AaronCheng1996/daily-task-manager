<template>
  <label class="toggle-switch" :class="{ disabled: disabled }">
    <input
      :checked="modelValue"
      type="checkbox"
      :disabled="disabled"
      class="toggle-input"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="toggle-slider" :class="{ active: modelValue }">
      <span class="toggle-thumb"></span>
    </span>
    <span v-if="label" class="toggle-label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  label?: string
  disabled?: boolean
}

defineProps<Props>()

defineEmits<{
  'update:modelValue': [value: boolean]
}>()
</script>

<style scoped>
.toggle-switch {
  @apply relative inline-flex items-center cursor-pointer;
}

.toggle-switch.disabled {
  @apply cursor-not-allowed opacity-50;
}

.toggle-input {
  @apply sr-only;
}

.toggle-slider {
  @apply relative w-12 h-6 bg-gray-300 rounded-full transition-all duration-300 ease-in-out;
  @apply focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2;
}

.toggle-slider.active {
  @apply bg-gradient-to-r from-primary-500 to-purple-500;
  @apply shadow-soft;
}

.toggle-thumb {
  @apply absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md;
  @apply transition-all duration-300 ease-in-out;
  @apply transform;
}

.toggle-slider.active .toggle-thumb {
  @apply translate-x-6;
}

.toggle-label {
  @apply ml-3 text-sm font-medium text-gray-700;
}

.toggle-switch.disabled .toggle-label {
  @apply text-gray-400;
}
</style>
