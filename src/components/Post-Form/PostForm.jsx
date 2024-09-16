import React, { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Input, RTE, Select } from '../index';
import appwriteService from '../../appwrite/config';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

function PostForm({ post }) {
  const { register, handleSubmit, watch, setValue, control, getValues } =
    useForm({
      defaultValues: {
        title: post?.title || '',
        slug: post?.$id || '',
        content: post?.content || '',
        status: post?.status || 'active',
      },
    });

  const navigate = useNavigate();
  const userData = useSelector((state) => state.auth.userData);

  // New Feature - Slug Exists Check

  const checkSlugExists = async (slug) => {
    const allposts = await appwriteService.getPosts();
    console.log(slug);
    console.log(allposts);
    const slugAvial = allposts.documents.some(
      (allpost) => allpost.$id === slug
    );
    return slugAvial;
  };

  const submit = async (data) => {
    // Slug Check
    if (!post) {
      const slugExists = await checkSlugExists(data.slug);

      if (slugExists) {
        alert('Slug already Exists, Try Different Slug');
      }
    }

    /////////////////////////////////

    if (post) {
      const file = data.image[0]
        ? await appwriteService.uploadFile(data.image[0])
        : null;

      if (file) {
        appwriteService.deleteFile(post.featuredImage);
      }

      const dbPost = await appwriteService.updatePost(post.$id, {
        ...data,
        featuredImage: file ? file.$id : undefined,
        // if image is already present than may be this code return wrong value in featured image ***may be not sure
      });

      if (dbPost) navigate(`/post/${dbPost.$id}`);
    } else {
      const file = await appwriteService.uploadFile(data.image[0]);

      if (file) {
        const fileId = file.$id;
        data.featuredImage = fileId;
        const dbPost = await appwriteService.createPost({
          ...data,
          userId: userData.$id,
        });

        if (dbPost) {
          navigate(`/post/${dbPost.$id}`);
        }
      }
    }
  };

  const slugTransform = useCallback((value) => {
    if (value && typeof value === 'string')
      return value
        .trim()
        .toLowerCase()
        .replace(/[^a-zA-Z\d\s]/g, '-')
        .replace(/\s/g, '-');

    return '';
  }, []);

  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name === 'title') {
        setValue('slug', slugTransform(value.title), { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, slugTransform, setValue]);

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-wrap">
      <div className="w-2/3 px-2">
        <Input
          label="Title :"
          placholder="Title"
          className="mb-4"
          {...register('title', { required: true })}
        />
        {!post && (
          <Input
            label="Slug :"
            placeholder="Slug"
            className="mb-4"
            {...register('slug', { required: true })}
            onInput={(e) => {
              setValue('slug', slugTransform(e.currentTarget.value), {
                shouldValidate: true,
              });
            }}
          />
        )}
        {/* <Input
          label="Slug :"
          placeholder="Slug"
          className="mb-4"
          {...register('slug', { required: true })}
          onInput={(e) => {
            setValue('slug', slugTransform(e.currentTarget.value), {
              shouldValidate: true,
            });
          }}
          // style={{ display: post ? 'none' : 'block' }}
        /> */}

        <RTE
          label="Content :"
          name="content"
          control={control}
          defaultValue={getValues('content')}
        />
      </div>

      <div className="w-1/3 px-2">
        <Input
          label="Featured Image :"
          type="file"
          className="mb-4"
          // accept="image/png, image/jpg, image/jpeg, image/gif"
          {...register('image', { required: !post })}
        />

        {post && (
          <div className="w-full mb-4">
            <img
              src={appwriteService.getFilePreview(post.featuredImage)}
              alt={post.title}
              className="rounded-lg"
            />
          </div>
        )}

        <Select
          options={['active', 'inactive']}
          label="status"
          className="mb-4"
          {...register('status', { required: true })}
        />
        <Button
          type="submit"
          bgColor={post ? 'bg-green-500' : undefined}
          className="w-full"
        >
          {post ? 'Update' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}

export default PostForm;
