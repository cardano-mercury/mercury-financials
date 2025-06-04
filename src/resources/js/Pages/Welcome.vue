<script setup>
import GuestLayout from "@/Layouts/GuestLayout.vue";

defineProps({
    canLogin: {
        type: Boolean,
    },
    canRegister: {
        type: Boolean,
    },
});
</script>
<template>
    <GuestLayout title="Welcome">
        <section id="features">Features</section>
        <section id="reviews">Reviews</section>
        <section id="pricing">Pricing</section>
    </GuestLayout>
</template>
