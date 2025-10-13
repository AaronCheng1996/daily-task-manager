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
