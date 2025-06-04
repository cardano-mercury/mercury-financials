<script setup>
import {ref} from 'vue';
import {Link, router, useForm} from '@inertiajs/vue3';
import FormSection from '@/Components/FormSection.vue';

const props = defineProps({
    user: Object,
});

const form = useForm({
    _method: 'PUT',
    name: props.user.name,
    email: props.user.email,
    photo: null,
});

const verificationLinkSent = ref(null);
const photoPreview = ref(null);
const photoInput = ref(null);

const updateProfileInformation = () => {
    if (photoInput.value) {
        form.photo = photoInput.value.files[0];
    }

    form.post(route('user-profile-information.update'), {
        errorBag: 'updateProfileInformation',
        preserveScroll: true,
        onSuccess: () => clearPhotoFileInput(),
    });
};

const sendEmailVerification = () => {
    verificationLinkSent.value = true;
};

const selectNewPhoto = () => {
    photoInput.value.click();
};

const updatePhotoPreview = () => {
    const photo = photoInput.value.files[0];

    if (!photo) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        photoPreview.value = e.target.result;
    };

    reader.readAsDataURL(photo);
};

const deletePhoto = () => {
    router.delete(route('current-user-photo.destroy'), {
        preserveScroll: true,
        onSuccess: () => {
            photoPreview.value = null;
            clearPhotoFileInput();
        },
    });
};

const clearPhotoFileInput = () => {
    if (photoInput.value?.value) {
        photoInput.value.value = null;
    }
};
</script>

<template>
    <FormSection @submitted="updateProfileInformation">
        <template #title>
            Profile Information
        </template>

        <template #description>
            Update your account's profile information and email address.
        </template>

        <template #form>
            <v-row>
                <v-col cols="6" sm="4"
                       class="justify-center align-center text-center"
                       v-if="$page.props.jetstream.managesProfilePhotos">
                    <v-file-input label="Photo" prepend-icon="mdi-camera"
                                  class="hidden-screen-only"/>
                    <v-avatar v-show="! photoPreview" class="my-2"
                              :image="user.profile_photo_url" size="x-large"
                              :alt="user.name"/>
                    <v-avatar v-show="photoPreview" class="my-2"
                              :image="photoPreview" size="x-large"/>
                    <div class="mb-2">
                        <v-btn color="secondary"
                               @click.prevent="selectNewPhoto">Select A New
                            Photo
                        </v-btn>
                        <v-btn color="secondary" v-if="user.profile_photo_path"
                               @click.prevent="deletePhoto">Remove Photo
                        </v-btn>
                    </div>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field v-model="form.name" required
                                  autocomplete="name" label="Name"/>
                </v-col>
                <v-col cols="6" sm="4">
                    <v-text-field v-model="form.email" required
                                  autocomplete="username"
                                  label="Email"/>
                    <template
                        v-if="$page.props.jetstream.hasEmailVerification && user.email_verified_at === null">
                        <v-alert type="error">
                            Your email address is unverified.
                            <Link
                                :href="route('verification.send')"
                                method="post"
                                as="button"
                                class=""
                                @click.prevent="sendEmailVerification"
                            >
                                Click here to re-send the verification
                                email.
                            </Link>
                        </v-alert>
                        <v-alert type="success"
                                 v-show="verificationLinkSent"
                                 class="my-2">
                            A new verification link has been sent to
                            your email address.
                        </v-alert>
                    </template>
                </v-col>

            </v-row>
            <!--            &lt;!&ndash; Profile Photo &ndash;&gt;-->
            <!--            <template v-if="$page.props.jetstream.managesProfilePhotos">-->
            <!--                <v-file-input label="Photo" prepend-icon="mdi-camera" class="hidden-screen-only" />-->
            <!--                <v-avatar v-show="! photoPreview" class="my-2" :image="user.profile_photo_url" size="x-large" :alt="user.name" />-->
            <!--                <v-avatar v-show="photoPreview" class="my-2" :image="photoPreview" size="x-large" />-->
            <!--                <div class="mb-2">-->
            <!--                    <v-btn color="secondary" @click.prevent="selectNewPhoto">Select A New Photo</v-btn>-->
            <!--                    <v-btn color="secondary" v-if="user.profile_photo_path" @click.prevent="deletePhoto">Remove Photo</v-btn>-->
            <!--                </div>-->

            <!--            </template>-->

            <!--            &lt;!&ndash; Name &ndash;&gt;-->
            <!--            <v-text-field v-model="form.name" required autocomplete="name" label="Name" />-->

            <!--            &lt;!&ndash; Email &ndash;&gt;-->
            <!--            <v-text-field v-model="form.email" required autocomplete="username" label="Email" />-->
            <!--            <template v-if="$page.props.jetstream.hasEmailVerification && user.email_verified_at === null">-->
            <!--                <v-alert type="error">-->
            <!--                    Your email address is unverified.-->
            <!--                    <Link-->
            <!--                        :href="route('verification.send')"-->
            <!--                        method="post"-->
            <!--                        as="button"-->
            <!--                        class=""-->
            <!--                        @click.prevent="sendEmailVerification"-->
            <!--                    >-->
            <!--                        Click here to re-send the verification email.-->
            <!--                    </Link>-->
            <!--                </v-alert>-->
            <!--                <v-alert type="success" v-show="verificationLinkSent" class="my-2">-->
            <!--                    A new verification link has been sent to your email address.-->
            <!--                </v-alert>-->
            <!--            </template>-->
        </template>

        <template #actions>
            <v-chip size="x-large" color="success" append-icon="mdi-check"
                    class="me-4" variant="flat"
                    v-show="form.recentlySuccessful">Saved.
            </v-chip>
            <v-btn color="primary" :loading="form.processing"
                   @click="updateProfileInformation">
                Save
            </v-btn>
        </template>
    </FormSection>
</template>
