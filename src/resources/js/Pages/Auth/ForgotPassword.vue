<script setup>
import {Link, useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

defineProps({
    status: String,
});

const form = useForm({
    email: '',
});

const submit = () => {
    form.post(route('password.email'));
};
</script>

<template>
    <GuestLayout title="Forgot Password">
        <v-container
            class="fill-height d-flex flex-column justify-center align-center text-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">
                        Forgot your password?
                    </div>
                    <div class="text-left text-body-2 mb-4">
                        No problem. Just let us know your email address and we
                        will email you a password reset link that will allow you
                        to choose a new one.
                    </div>
                </v-card-text>
                <v-card-text v-if="status">
                    <v-alert icon="$success" border color="primary">
                        {{status}}
                    </v-alert>
                </v-card-text>
                <v-card-text>
                    <v-form @submit.prevent="submit">
                        <v-text-field id="email" v-model="form.email"
                                      type="email" required autofocus
                                      autocomplete="username"
                                      label="Email..."
                                      prepend-icon="mdi-email-outline"/>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block :disabled="form.processing"
                               :loading="form.processing">
                            Email Password Reset Link
                        </v-btn>
                    </v-form>
                </v-card-text>
                <v-card-text class="my-8">
                    Did you remember it?
                    <Link :href="route('login')" class="font-weight-black">
                        Sign In!
                    </Link>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
