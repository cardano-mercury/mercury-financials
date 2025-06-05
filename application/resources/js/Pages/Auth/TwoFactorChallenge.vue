<script setup>
import {nextTick, ref} from 'vue';
import {useForm} from '@inertiajs/vue3';
import GuestLayout from "@/Layouts/GuestLayout.vue";

const recovery = ref(false);

const form = useForm({
    code: '',
    recovery_code: '',
});

const recoveryCodeInput = ref(null);
const codeInput = ref(null);

const toggleRecovery = async () => {
    recovery.value ^= true;

    await nextTick();

    if (recovery.value) {
        recoveryCodeInput.value.focus();
        form.code = '';
    } else {
        codeInput.value.focus();
        form.recovery_code = '';
    }
};

const submit = () => {
    form.post(route('two-factor.login'));
};
</script>

<template>
    <GuestLayout title="Two-factor Confirmation">
        <v-container
            class="fill-height d-flex flex-column justify-center text-center align-center">
            <v-card width="512" elevation="1" class="px-8">
                <v-card-text>
                    <div class="text-h4 text-primary font-weight-black">
                        Two-Factor Confirmation
                    </div>
                    <div class="text-center text-body-2 mb-4">
                        <template v-if="! recovery">
                            Please confirm access to your account by entering
                            the authentication code provided by your
                            authenticator application.
                        </template>

                        <template v-else>
                            Please confirm access to your account by entering
                            one of your emergency recovery codes.
                        </template>
                    </div>
                </v-card-text>
                <v-card-text>
                    <v-form @submit.prevent="submit">
                        <template v-if="! recovery">
                            <v-text-field id="code" ref="codeInput"
                                          v-model="form.code" type="text"
                                          inputmode="numeric" autofocus
                                          autocomplete="one-time-code"
                                          label="Code"
                            />
                        </template>
                        <template v-else>
                            <v-text-field id="recovery_code"
                                          ref="recoveryCodeInput"
                                          v-model="form.recovery_code"
                                          type="text"
                                          inputmode="numeric" autofocus
                                          autocomplete="one-time-code"
                                          label="Recovery Code"
                            />
                        </template>
                        <v-btn type="button" color="primary" block class="mb-4"
                               @click.prevent="toggleRecovery">
                            <template v-if="! recover">
                                Use a recovery code
                            </template>
                            <template v-else>
                                Use an authentication code
                            </template>
                        </v-btn>
                        <v-btn type="submit" color="black" variant="flat"
                               size="large" block :disabled="form.processing" :loading="form.processing">
                            Log In
                        </v-btn>
                    </v-form>
                </v-card-text>
            </v-card>
        </v-container>
    </GuestLayout>
</template>
