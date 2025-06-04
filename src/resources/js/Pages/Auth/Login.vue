<script setup>
import {Link, useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

defineProps({
    canResetPassword: Boolean,
    status: String,
});

const form = useForm({
    email: '',
    password: '',
    remember: false,
});

const submit = () => {
    form.transform(data => ({
        ...data,
        remember: form.remember ? 'on' : '',
    })).post(route('login'), {
        onFinish: () => form.reset('password'),
    });
};
</script>

<template>
    <GuestLayout title="Log In">
        <v-container
            class="fill-height d-flex flex-column justify-center text-center align-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">Sign In
                        to Mercury
                    </div>
                    <div class="text-center text-body-2 mb-4">Experience the
                        Future of Crypto Payments
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
                                      label="Type your email..."
                                      prepend-icon="mdi-email-outline"/>
                        <v-text-field id="password" v-model="form.password"
                                      type="password" required
                                      autocomplete="current-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Type your password..."/>
                        <v-row align="start">
                            <v-col cols="12" md="6">
                                <v-checkbox v-model="form.remember"
                                            name="remember"
                                            label="Remember me"/>
                            </v-col>
                            <v-col cols="12" md="6">
                                <v-btn color="primary" variant="text"
                                       v-if="canResetPassword"
                                       :href="route('password.request')">Forgot
                                    password?
                                </v-btn>
                            </v-col>
                        </v-row>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block>Sign In
                        </v-btn>
                    </v-form>
                </v-card-text>
                <v-card-text class="my-8">
                    Don't have an account?
                    <Link :href="route('register')" class="font-weight-black">Sign Up!</Link>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
