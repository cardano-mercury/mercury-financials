<script setup>
import {Link, useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

const form = useForm({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    terms: false,
});

const submit = () => {
    form.post(route('register'), {
        onFinish: () => form.reset('password', 'password_confirmation'),
    });
};
</script>

<template>
    <GuestLayout title="Register">
        <v-container
            class="fill-height d-flex flex-column justify-center text-center align-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">Sign Up
                    </div>
                    <div class="text-center text-body-2 mb-4">
                        Fill in the details to create an account
                    </div>
                </v-card-text>
                <v-card-text>
                    <v-form @submit.prevent="submit">
                        <v-text-field id="name" v-model="form.name" type="text"
                                      required autofocus autocomplete="name"
                                      label="Name..."
                                      prepend-icon="mdi-account"/>
                        <v-text-field id="email" v-model="form.email"
                                      type="email" required autofocus
                                      autocomplete="username"
                                      label="Email..."
                                      prepend-icon="mdi-email-outline"/>
                        <v-text-field id="password" v-model="form.password"
                                      type="password" required
                                      autocomplete="new-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Password..."/>
                        <v-text-field id="password_confirmation"
                                      v-model="form.password_confirmation"
                                      type="password" required
                                      autocomplete="new-password"
                                      prepend-icon="mdi-lock-outline"
                                      label="Confirm password..."/>
                        <v-checkbox v-model="form.terms"
                                    name="remember" required>
                            <template v-slot:label>
                                I have read and agree to the &nbsp;
                                <Link>
                                    Terms and Conditions
                                </Link>
                            </template>
                        </v-checkbox>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block>Sign Up
                        </v-btn>
                    </v-form>
                </v-card-text>
                <v-card-text class="my-8">
                    Already registered?
                    <Link :href="route('login')" class="font-weight-black">
                        Sign In!
                    </Link>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
