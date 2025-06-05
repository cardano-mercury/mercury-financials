<script setup>
import {computed} from 'vue';
import {useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

const props = defineProps({
    status: String,
});

const form = useForm({});

const submit = () => {
    form.post(route('verification.send'));
};

const verificationLinkSent = computed(() => props.status === 'verification-link-sent');
</script>

<template>
    <GuestLayout title="Email Verification">
        <v-container
            class="fill-height d-flex flex-column justify-center text-center align-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">
                        Verify Email
                    </div>
                    <div class="text-center text-left text-body-2 mb-4">
                        Before continuing, could you verify your email address
                        by clicking on the link we just emailed to you? If you
                        didn't receive the email, we will gladly send you
                        another.
                    </div>
                </v-card-text>
                <v-card-text v-if="status">
                    <v-alert icon="$success" border color="primary">
                        {{status}}
                    </v-alert>
                </v-card-text>
                <v-card-text v-if="verificationLinkSent">
                    <v-alert type="info" border>
                        A new verification link has been sent to the email address
                        you provided in your profile settings.
                    </v-alert>
                </v-card-text>
                <v-card-text>
                    <v-form @submit.prevent="submit">
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block :disabled="form.processing" :loading="form.processing">
                            Resend Verification Email
                        </v-btn>
                    </v-form>
                </v-card-text>
                <v-card-text>
                    <v-row>
                        <v-col cols="12" md="6">
                            <v-btn :href="route('profile.show')" variant="text">Edit Profile</v-btn>
                        </v-col>
                        <v-col cols="12" md="6">
                            <v-btn :href="route('logout')" method="post" variant="text">Log Out</v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
